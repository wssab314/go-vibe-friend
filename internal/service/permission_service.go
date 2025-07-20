package service

import (
	"fmt"

	"go-vibe-friend/internal/models"
	"go-vibe-friend/internal/store"
)

type PermissionService struct {
	permissionStore *store.PermissionStore
	userStore       *store.UserStore
}

func NewPermissionService(permissionStore *store.PermissionStore, userStore *store.UserStore) *PermissionService {
	return &PermissionService{
		permissionStore: permissionStore,
		userStore:       userStore,
	}
}

// CreatePermission 创建权限
func (s *PermissionService) CreatePermission(name, description, resource, action string) (*models.Permission, error) {
	// 检查权限是否已存在
	existing, err := s.permissionStore.GetPermissionByName(name)
	if err != nil {
		return nil, fmt.Errorf("检查权限失败: %v", err)
	}
	if existing != nil {
		return nil, fmt.Errorf("权限已存在: %s", name)
	}

	permission := &models.Permission{
		Name:        name,
		Description: description,
		Resource:    resource,
		Action:      action,
	}

	if err := s.permissionStore.CreatePermission(permission); err != nil {
		return nil, fmt.Errorf("创建权限失败: %v", err)
	}

	return permission, nil
}

// GetPermissions 获取权限列表
func (s *PermissionService) GetPermissions(limit, offset int) ([]models.Permission, error) {
	return s.permissionStore.GetPermissions(limit, offset)
}

// GetPermissionsByResource 根据资源类型获取权限
func (s *PermissionService) GetPermissionsByResource(resource string) ([]models.Permission, error) {
	return s.permissionStore.GetPermissionsByResource(resource)
}

// AssignPermissionToRole 给角色分配权限
func (s *PermissionService) AssignPermissionToRole(roleID, permissionID uint) error {
	return s.permissionStore.AssignPermissionToRole(roleID, permissionID)
}

// RemovePermissionFromRole 移除角色的权限
func (s *PermissionService) RemovePermissionFromRole(roleID, permissionID uint) error {
	return s.permissionStore.RemovePermissionFromRole(roleID, permissionID)
}

// GetRolePermissions 获取角色的权限
func (s *PermissionService) GetRolePermissions(roleID uint) ([]models.Permission, error) {
	return s.permissionStore.GetRolePermissions(roleID)
}

// GetUserPermissions 获取用户的所有权限
func (s *PermissionService) GetUserPermissions(userID uint) ([]models.Permission, error) {
	return s.permissionStore.GetUserPermissions(userID)
}

// CheckUserPermission 检查用户是否具有特定权限
func (s *PermissionService) CheckUserPermission(userID uint, resource, action string) (bool, error) {
	return s.permissionStore.CheckUserPermission(userID, resource, action)
}

// AssignPermissionToUser 给用户分配直接权限
func (s *PermissionService) AssignPermissionToUser(userID, permissionID uint, isDenied bool) error {
	return s.permissionStore.AssignPermissionToUser(userID, permissionID, isDenied)
}

// RemovePermissionFromUser 移除用户的直接权限
func (s *PermissionService) RemovePermissionFromUser(userID, permissionID uint) error {
	return s.permissionStore.RemovePermissionFromUser(userID, permissionID)
}

// CreateResourcePolicy 创建资源策略
func (s *PermissionService) CreateResourcePolicy(resourceType string, resourceID, ownerID uint, isPublic, isShared bool, sharePolicy string) (*models.ResourcePolicy, error) {
	policy := &models.ResourcePolicy{
		ResourceType: resourceType,
		ResourceID:   resourceID,
		OwnerID:      ownerID,
		IsPublic:     isPublic,
		IsShared:     isShared,
		SharePolicy:  sharePolicy,
	}

	if err := s.permissionStore.CreateResourcePolicy(policy); err != nil {
		return nil, fmt.Errorf("创建资源策略失败: %v", err)
	}

	return policy, nil
}

// CheckResourceAccess 检查用户是否可以访问特定资源
func (s *PermissionService) CheckResourceAccess(userID uint, resourceType string, resourceID uint) (bool, error) {
	return s.permissionStore.CheckResourceAccess(userID, resourceType, resourceID)
}

// InitializeDefaultPermissions 初始化默认权限
func (s *PermissionService) InitializeDefaultPermissions() error {
	defaultPermissions := []struct {
		Name        string
		Description string
		Resource    string
		Action      string
	}{
		// 用户管理权限
		{"user.create", "创建用户", "user", "create"},
		{"user.read", "查看用户", "user", "read"},
		{"user.update", "更新用户", "user", "update"},
		{"user.delete", "删除用户", "user", "delete"},
		{"user.manage", "管理用户", "user", "manage"},

		// 个人资料权限
		{"profile.read", "查看个人资料", "profile", "read"},
		{"profile.update", "更新个人资料", "profile", "update"},

		// 文件管理权限
		{"file.create", "上传文件", "file", "create"},
		{"file.read", "查看文件", "file", "read"},
		{"file.update", "更新文件", "file", "update"},
		{"file.delete", "删除文件", "file", "delete"},
		{"file.manage", "管理文件", "file", "manage"},

		// 任务管理权限
		{"job.create", "创建任务", "job", "create"},
		{"job.read", "查看任务", "job", "read"},
		{"job.update", "更新任务", "job", "update"},
		{"job.delete", "删除任务", "job", "delete"},
		{"job.manage", "管理任务", "job", "manage"},

		// 系统管理权限
		{"system.dashboard", "查看系统面板", "system", "dashboard"},
		{"system.settings", "系统设置", "system", "settings"},
		{"system.logs", "查看系统日志", "system", "logs"},
		{"system.backup", "系统备份", "system", "backup"},

		// 邮件权限
		{"email.send", "发送邮件", "email", "send"},
		{"email.read", "查看邮件", "email", "read"},
		{"email.manage", "管理邮件", "email", "manage"},

		// API权限
		{"api.access", "API访问", "api", "access"},
		{"api.admin", "管理API", "api", "admin"},
	}

	for _, perm := range defaultPermissions {
		existing, err := s.permissionStore.GetPermissionByName(perm.Name)
		if err != nil {
			return err
		}
		if existing == nil {
			_, err := s.CreatePermission(perm.Name, perm.Description, perm.Resource, perm.Action)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

// GetPermissionStats 获取权限统计信息
func (s *PermissionService) GetPermissionStats() (map[string]interface{}, error) {
	return s.permissionStore.GetPermissionStats()
}

// ValidatePermission 验证权限格式
func (s *PermissionService) ValidatePermission(resource, action string) bool {
	validResources := []string{"user", "profile", "file", "job", "system", "email", "api"}
	validActions := []string{"create", "read", "update", "delete", "manage", "send", "dashboard", "settings", "logs", "backup", "access", "admin"}

	resourceValid := false
	for _, r := range validResources {
		if r == resource {
			resourceValid = true
			break
		}
	}

	actionValid := false
	for _, a := range validActions {
		if a == action {
			actionValid = true
			break
		}
	}

	return resourceValid && actionValid
}

// GetUserRolePermissions 获取用户通过角色获得的权限
func (s *PermissionService) GetUserRolePermissions(userID uint) (map[string][]models.Permission, error) {
	// 获取用户的角色名称
	roleNames, err := s.userStore.GetUserRoles(userID)
	if err != nil {
		return nil, err
	}

	rolePermissions := make(map[string][]models.Permission)
	for _, roleName := range roleNames {
		// 通过角色名称获取角色ID
		role, err := s.permissionStore.GetRoleByName(roleName)
		if err != nil {
			return nil, err
		}
		if role != nil {
			permissions, err := s.GetRolePermissions(role.ID)
			if err != nil {
				return nil, err
			}
			rolePermissions[roleName] = permissions
		}
	}

	return rolePermissions, nil
}

// ===== 角色管理方法 =====

// CreateRole 创建角色
func (s *PermissionService) CreateRole(name, description string) (*models.Role, error) {
	// 检查角色是否已存在
	existing, err := s.permissionStore.GetRoleByName(name)
	if err != nil {
		return nil, fmt.Errorf("检查角色失败: %v", err)
	}
	if existing != nil {
		return nil, fmt.Errorf("角色已存在: %s", name)
	}

	role := &models.Role{
		Name:        name,
		Description: description,
	}

	if err := s.permissionStore.CreateRole(role); err != nil {
		return nil, fmt.Errorf("创建角色失败: %v", err)
	}

	return role, nil
}

// GetRoles 获取角色列表
func (s *PermissionService) GetRoles(limit, offset int) ([]models.Role, error) {
	return s.permissionStore.GetRoles(limit, offset)
}

// GetRole 获取单个角色详情
func (s *PermissionService) GetRole(roleID uint) (*models.Role, error) {
	return s.permissionStore.GetRoleByID(roleID)
}

// UpdateRole 更新角色
func (s *PermissionService) UpdateRole(roleID uint, name, description string) (*models.Role, error) {
	// 检查角色是否存在
	role, err := s.permissionStore.GetRoleByID(roleID)
	if err != nil {
		return nil, fmt.Errorf("获取角色失败: %v", err)
	}
	if role == nil {
		return nil, fmt.Errorf("角色不存在: %d", roleID)
	}

	// 如果名称改变，检查新名称是否已存在
	if role.Name != name {
		existing, err := s.permissionStore.GetRoleByName(name)
		if err != nil {
			return nil, fmt.Errorf("检查角色名称失败: %v", err)
		}
		if existing != nil && existing.ID != roleID {
			return nil, fmt.Errorf("角色名称已存在: %s", name)
		}
	}

	role.Name = name
	role.Description = description

	if err := s.permissionStore.UpdateRole(role); err != nil {
		return nil, fmt.Errorf("更新角色失败: %v", err)
	}

	return role, nil
}

// DeleteRole 删除角色
func (s *PermissionService) DeleteRole(roleID uint) error {
	// 检查角色是否存在
	role, err := s.permissionStore.GetRoleByID(roleID)
	if err != nil {
		return fmt.Errorf("获取角色失败: %v", err)
	}
	if role == nil {
		return fmt.Errorf("角色不存在: %d", roleID)
	}

	// 检查是否有用户关联到这个角色
	userCount, err := s.permissionStore.GetRoleUserCount(roleID)
	if err != nil {
		return fmt.Errorf("检查角色关联用户失败: %v", err)
	}
	if userCount > 0 {
		return fmt.Errorf("无法删除角色，还有 %d 个用户关联到此角色", userCount)
	}

	return s.permissionStore.DeleteRole(roleID)
}

// AssignRoleToUser 给用户分配角色
func (s *PermissionService) AssignRoleToUser(userID, roleID uint) error {
	// 检查用户是否存在
	user, err := s.userStore.GetUserByID(userID)
	if err != nil {
		return fmt.Errorf("获取用户失败: %v", err)
	}
	if user == nil {
		return fmt.Errorf("用户不存在: %d", userID)
	}

	// 检查角色是否存在
	role, err := s.permissionStore.GetRoleByID(roleID)
	if err != nil {
		return fmt.Errorf("获取角色失败: %v", err)
	}
	if role == nil {
		return fmt.Errorf("角色不存在: %d", roleID)
	}

	// 检查用户是否已经有这个角色
	hasRole, err := s.permissionStore.CheckUserHasRole(userID, roleID)
	if err != nil {
		return fmt.Errorf("检查用户角色失败: %v", err)
	}
	if hasRole {
		return fmt.Errorf("用户已经拥有此角色")
	}

	return s.permissionStore.AssignRoleToUser(userID, roleID)
}

// RemoveRoleFromUser 移除用户的角色
func (s *PermissionService) RemoveRoleFromUser(userID, roleID uint) error {
	// 检查用户是否存在
	user, err := s.userStore.GetUserByID(userID)
	if err != nil {
		return fmt.Errorf("获取用户失败: %v", err)
	}
	if user == nil {
		return fmt.Errorf("用户不存在: %d", userID)
	}

	// 检查角色是否存在
	role, err := s.permissionStore.GetRoleByID(roleID)
	if err != nil {
		return fmt.Errorf("获取角色失败: %v", err)
	}
	if role == nil {
		return fmt.Errorf("角色不存在: %d", roleID)
	}

	// 检查用户是否有这个角色
	hasRole, err := s.permissionStore.CheckUserHasRole(userID, roleID)
	if err != nil {
		return fmt.Errorf("检查用户角色失败: %v", err)
	}
	if !hasRole {
		return fmt.Errorf("用户没有此角色")
	}

	return s.permissionStore.RemoveRoleFromUser(userID, roleID)
}

// GetUserRoles 获取用户的角色
func (s *PermissionService) GetUserRoles(userID uint) ([]models.Role, error) {
	// 检查用户是否存在
	user, err := s.userStore.GetUserByID(userID)
	if err != nil {
		return nil, fmt.Errorf("获取用户失败: %v", err)
	}
	if user == nil {
		return nil, fmt.Errorf("用户不存在: %d", userID)
	}

	return s.permissionStore.GetUserRolesByID(userID)
}