package store

import (
	"errors"

	"go-vibe-friend/internal/models"

	"gorm.io/gorm"
)

type PermissionStore struct {
	db *Database
}

func NewPermissionStore(db *Database) *PermissionStore {
	return &PermissionStore{db: db}
}

// GetRoleByName 根据名称获取角色
func (s *PermissionStore) GetRoleByName(name string) (*models.Role, error) {
	var role models.Role
	err := s.db.DB.Where("name = ?", name).First(&role).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &role, err
}

// CreatePermission 创建权限
func (s *PermissionStore) CreatePermission(permission *models.Permission) error {
	return s.db.DB.Create(permission).Error
}

// GetPermissionByID 根据ID获取权限
func (s *PermissionStore) GetPermissionByID(id uint) (*models.Permission, error) {
	var permission models.Permission
	err := s.db.DB.First(&permission, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &permission, err
}

// GetPermissionByName 根据名称获取权限
func (s *PermissionStore) GetPermissionByName(name string) (*models.Permission, error) {
	var permission models.Permission
	err := s.db.DB.Where("name = ?", name).First(&permission).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &permission, err
}

// GetPermissions 获取权限列表
func (s *PermissionStore) GetPermissions(limit, offset int) ([]models.Permission, error) {
	var permissions []models.Permission
	err := s.db.DB.Order("created_at DESC").Limit(limit).Offset(offset).Find(&permissions).Error
	return permissions, err
}

// GetPermissionsByResource 根据资源类型获取权限
func (s *PermissionStore) GetPermissionsByResource(resource string) ([]models.Permission, error) {
	var permissions []models.Permission
	err := s.db.DB.Where("resource = ?", resource).Find(&permissions).Error
	return permissions, err
}

// UpdatePermission 更新权限
func (s *PermissionStore) UpdatePermission(permission *models.Permission) error {
	return s.db.DB.Save(permission).Error
}

// DeletePermission 删除权限
func (s *PermissionStore) DeletePermission(id uint) error {
	return s.db.DB.Delete(&models.Permission{}, id).Error
}

// AssignPermissionToRole 给角色分配权限
func (s *PermissionStore) AssignPermissionToRole(roleID, permissionID uint) error {
	rolePermission := &models.RolePermission{
		RoleID:       roleID,
		PermissionID: permissionID,
	}
	return s.db.DB.Create(rolePermission).Error
}

// RemovePermissionFromRole 移除角色的权限
func (s *PermissionStore) RemovePermissionFromRole(roleID, permissionID uint) error {
	return s.db.DB.Where("role_id = ? AND permission_id = ?", roleID, permissionID).
		Delete(&models.RolePermission{}).Error
}

// GetRolePermissions 获取角色的权限
func (s *PermissionStore) GetRolePermissions(roleID uint) ([]models.Permission, error) {
	var permissions []models.Permission
	err := s.db.DB.Table("permissions").
		Joins("JOIN role_permissions ON permissions.id = role_permissions.permission_id").
		Where("role_permissions.role_id = ? AND role_permissions.deleted_at IS NULL", roleID).
		Find(&permissions).Error
	return permissions, err
}

// GetUserPermissions 获取用户的所有权限（包括角色权限和直接权限）
func (s *PermissionStore) GetUserPermissions(userID uint) ([]models.Permission, error) {
	var permissions []models.Permission
	
	// 通过角色获取权限
	err := s.db.DB.Table("permissions").
		Joins("JOIN role_permissions ON permissions.id = role_permissions.permission_id").
		Joins("JOIN user_roles ON role_permissions.role_id = user_roles.role_id").
		Where("user_roles.user_id = ? AND user_roles.deleted_at IS NULL AND role_permissions.deleted_at IS NULL", userID).
		Find(&permissions).Error
	
	if err != nil {
		return nil, err
	}
	
	// 获取直接权限
	var directPermissions []models.Permission
	err = s.db.DB.Table("permissions").
		Joins("JOIN user_permissions ON permissions.id = user_permissions.permission_id").
		Where("user_permissions.user_id = ? AND user_permissions.is_denied = false AND user_permissions.deleted_at IS NULL", userID).
		Find(&directPermissions).Error
	
	if err != nil {
		return permissions, nil // 返回已获取的角色权限
	}
	
	// 合并权限（去重）
	permissionMap := make(map[uint]models.Permission)
	for _, p := range permissions {
		permissionMap[p.ID] = p
	}
	for _, p := range directPermissions {
		permissionMap[p.ID] = p
	}
	
	// 获取被拒绝的权限
	var deniedPermissions []models.Permission
	err = s.db.DB.Table("permissions").
		Joins("JOIN user_permissions ON permissions.id = user_permissions.permission_id").
		Where("user_permissions.user_id = ? AND user_permissions.is_denied = true AND user_permissions.deleted_at IS NULL", userID).
		Find(&deniedPermissions).Error
	
	if err == nil {
		// 移除被拒绝的权限
		for _, p := range deniedPermissions {
			delete(permissionMap, p.ID)
		}
	}
	
	// 转换为切片
	result := make([]models.Permission, 0, len(permissionMap))
	for _, p := range permissionMap {
		result = append(result, p)
	}
	
	return result, nil
}

// CheckUserPermission 检查用户是否具有特定权限
func (s *PermissionStore) CheckUserPermission(userID uint, resource, action string) (bool, error) {
	permissions, err := s.GetUserPermissions(userID)
	if err != nil {
		return false, err
	}
	
	for _, p := range permissions {
		if p.Resource == resource && p.Action == action {
			return true, nil
		}
	}
	
	return false, nil
}

// AssignPermissionToUser 给用户分配直接权限
func (s *PermissionStore) AssignPermissionToUser(userID, permissionID uint, isDenied bool) error {
	userPermission := &models.UserPermission{
		UserID:       userID,
		PermissionID: permissionID,
		IsDenied:     isDenied,
	}
	return s.db.DB.Create(userPermission).Error
}

// RemovePermissionFromUser 移除用户的直接权限
func (s *PermissionStore) RemovePermissionFromUser(userID, permissionID uint) error {
	return s.db.DB.Where("user_id = ? AND permission_id = ?", userID, permissionID).
		Delete(&models.UserPermission{}).Error
}

// CreateResourcePolicy 创建资源策略
func (s *PermissionStore) CreateResourcePolicy(policy *models.ResourcePolicy) error {
	return s.db.DB.Create(policy).Error
}

// GetResourcePolicy 获取资源策略
func (s *PermissionStore) GetResourcePolicy(resourceType string, resourceID uint) (*models.ResourcePolicy, error) {
	var policy models.ResourcePolicy
	err := s.db.DB.Where("resource_type = ? AND resource_id = ?", resourceType, resourceID).First(&policy).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &policy, err
}

// CheckResourceAccess 检查用户是否可以访问特定资源
func (s *PermissionStore) CheckResourceAccess(userID uint, resourceType string, resourceID uint) (bool, error) {
	// 获取资源策略
	policy, err := s.GetResourcePolicy(resourceType, resourceID)
	if err != nil {
		return false, err
	}
	
	if policy == nil {
		return false, nil // 没有策略，默认拒绝
	}
	
	// 检查是否是所有者
	if policy.OwnerID == userID {
		return true, nil
	}
	
	// 检查是否公开
	if policy.IsPublic {
		return true, nil
	}
	
	// TODO: 检查共享策略
	
	return false, nil
}

// CreateAPIRateLimit 创建API限流规则
func (s *PermissionStore) CreateAPIRateLimit(rateLimit *models.APIRateLimit) error {
	return s.db.DB.Create(rateLimit).Error
}

// GetAPIRateLimit 获取API限流规则
func (s *PermissionStore) GetAPIRateLimit(roleID uint, endpoint, method string) (*models.APIRateLimit, error) {
	var rateLimit models.APIRateLimit
	err := s.db.DB.Where("role_id = ? AND endpoint = ? AND method = ?", roleID, endpoint, method).First(&rateLimit).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &rateLimit, err
}

// GetPermissionStats 获取权限统计信息
func (s *PermissionStore) GetPermissionStats() (map[string]interface{}, error) {
	stats := make(map[string]interface{})
	
	// 总权限数
	var totalPermissions int64
	err := s.db.DB.Model(&models.Permission{}).Count(&totalPermissions).Error
	if err != nil {
		return nil, err
	}
	stats["total_permissions"] = totalPermissions
	
	// 按资源类型统计
	var resourceStats []struct {
		Resource string `json:"resource"`
		Count    int64  `json:"count"`
	}
	err = s.db.DB.Model(&models.Permission{}).
		Select("resource, COUNT(*) as count").
		Group("resource").
		Scan(&resourceStats).Error
	if err != nil {
		return nil, err
	}
	stats["by_resource"] = resourceStats
	
	// 角色权限统计
	var rolePermissionCount int64
	err = s.db.DB.Model(&models.RolePermission{}).Count(&rolePermissionCount).Error
	if err != nil {
		return nil, err
	}
	stats["role_permissions"] = rolePermissionCount
	
	// 用户直接权限统计
	var userPermissionCount int64
	err = s.db.DB.Model(&models.UserPermission{}).Count(&userPermissionCount).Error
	if err != nil {
		return nil, err
	}
	stats["user_permissions"] = userPermissionCount
	
	// 有权限的用户数
	var usersWithPermissions int64
	err = s.db.DB.Table("users").
		Joins("LEFT JOIN user_roles ON users.id = user_roles.user_id").
		Joins("LEFT JOIN user_permissions ON users.id = user_permissions.user_id").
		Where("user_roles.id IS NOT NULL OR user_permissions.id IS NOT NULL").
		Count(&usersWithPermissions).Error
	if err != nil {
		return nil, err
	}
	stats["users_with_permissions"] = usersWithPermissions
	
	// 总角色数
	var totalRoles int64
	err = s.db.DB.Model(&models.Role{}).Count(&totalRoles).Error
	if err != nil {
		return nil, err
	}
	stats["total_roles"] = totalRoles
	
	return stats, nil
}

// ===== 角色管理方法 =====

// CreateRole 创建角色
func (s *PermissionStore) CreateRole(role *models.Role) error {
	return s.db.DB.Create(role).Error
}

// GetRoles 获取角色列表
func (s *PermissionStore) GetRoles(limit, offset int) ([]models.Role, error) {
	var roles []models.Role
	err := s.db.DB.Order("created_at DESC").Limit(limit).Offset(offset).Find(&roles).Error
	return roles, err
}

// GetRoleByID 根据ID获取角色
func (s *PermissionStore) GetRoleByID(roleID uint) (*models.Role, error) {
	var role models.Role
	err := s.db.DB.First(&role, roleID).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &role, err
}

// UpdateRole 更新角色
func (s *PermissionStore) UpdateRole(role *models.Role) error {
	return s.db.DB.Save(role).Error
}

// DeleteRole 删除角色
func (s *PermissionStore) DeleteRole(roleID uint) error {
	// 删除角色相关的权限关联
	err := s.db.DB.Where("role_id = ?", roleID).Delete(&models.RolePermission{}).Error
	if err != nil {
		return err
	}
	
	// 删除角色相关的用户关联
	err = s.db.DB.Where("role_id = ?", roleID).Delete(&models.UserRole{}).Error
	if err != nil {
		return err
	}
	
	// 删除角色
	return s.db.DB.Delete(&models.Role{}, roleID).Error
}

// GetRoleUserCount 获取角色关联的用户数量
func (s *PermissionStore) GetRoleUserCount(roleID uint) (int64, error) {
	var count int64
	err := s.db.DB.Model(&models.UserRole{}).Where("role_id = ?", roleID).Count(&count).Error
	return count, err
}

// AssignRoleToUser 给用户分配角色
func (s *PermissionStore) AssignRoleToUser(userID, roleID uint) error {
	userRole := &models.UserRole{
		UserID: userID,
		RoleID: roleID,
	}
	return s.db.DB.Create(userRole).Error
}

// RemoveRoleFromUser 移除用户的角色
func (s *PermissionStore) RemoveRoleFromUser(userID, roleID uint) error {
	return s.db.DB.Where("user_id = ? AND role_id = ?", userID, roleID).
		Delete(&models.UserRole{}).Error
}

// CheckUserHasRole 检查用户是否有指定角色
func (s *PermissionStore) CheckUserHasRole(userID, roleID uint) (bool, error) {
	var count int64
	err := s.db.DB.Model(&models.UserRole{}).
		Where("user_id = ? AND role_id = ?", userID, roleID).
		Count(&count).Error
	return count > 0, err
}

// GetUserRolesByID 根据用户ID获取用户的角色
func (s *PermissionStore) GetUserRolesByID(userID uint) ([]models.Role, error) {
	var roles []models.Role
	err := s.db.DB.Table("roles").
		Joins("JOIN user_roles ON roles.id = user_roles.role_id").
		Where("user_roles.user_id = ? AND user_roles.deleted_at IS NULL", userID).
		Find(&roles).Error
	return roles, err
}