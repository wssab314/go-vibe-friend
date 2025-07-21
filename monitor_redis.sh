#!/bin/bash

# Redis实时监控脚本
echo "🔍 Redis实时监控 (按Ctrl+C退出)"
echo "========================================"

# 函数：获取Redis统计信息
get_redis_stats() {
    echo "⏰ $(date '+%H:%M:%S')"
    
    # 连接信息
    echo "📊 连接状态:"
    docker-compose exec redis redis-cli info clients | grep -E "connected_clients|blocked_clients"
    
    # 内存使用
    echo "💾 内存使用:"
    docker-compose exec redis redis-cli info memory | grep -E "used_memory_human|used_memory_peak_human"
    
    # 键统计
    echo "🔑 键统计:"
    docker-compose exec redis redis-cli info keyspace
    
    # 操作统计
    echo "📈 操作统计:"
    docker-compose exec redis redis-cli info stats | grep -E "total_commands_processed|instantaneous_ops_per_sec"
    
    # 会话相关键
    echo "🔐 应用会话键:"
    docker-compose exec redis redis-cli keys "go_vibe_friend:session:*" | head -5
    
    # 缓存相关键  
    echo "⚡ 应用缓存键:"
    docker-compose exec redis redis-cli keys "go_vibe_friend:cache:*" | head -5
    
    # 队列相关键
    echo "📋 应用队列键:"
    docker-compose exec redis redis-cli keys "go_vibe_friend:queue:*" | head -5
    
    echo "========================================"
}

# 主循环
while true; do
    clear
    get_redis_stats
    sleep 3
done