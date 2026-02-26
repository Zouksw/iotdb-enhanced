#!/bin/bash
# IoTDB Enhanced - Test Suite
# ==============================
# 统一测试脚本：功能测试 + AI 完整测试

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# 测试计数
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 测试结果记录
test_result() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ $1 -eq 0 ]; then
        echo -e "  ${GREEN}✓${NC} $2"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "  ${RED}✗${NC} $2"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# 显示标题
print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# 检查服务健康
check_service() {
    local url="$1"
    local name="$2"
    if curl -sf "$url" > /dev/null 2>&1; then
        test_result 0 "$name is accessible"
        return 0
    else
        test_result 1 "$name is NOT accessible"
        return 1
    fi
}

# 基础功能测试
run_basic_tests() {
    print_header "基础功能测试"

    echo "检查服务可用性..."
    check_service "$BACKEND_URL/api/health" "Backend API"
    check_service "$FRONTEND_URL" "Frontend"
    check_service "http://localhost:18080/rest/v1/version" "IoTDB REST API"

    echo ""
    echo "测试 API 端点..."

    # 测试时序数据 API
    if curl -sf "$BACKEND_URL/api/timeseries" > /dev/null 2>&1; then
        test_result 0 "Timeseries API endpoint"
    else
        test_result 1 "Timeseries API endpoint"
    fi

    # 测试数据集 API
    if curl -sf "$BACKEND_URL/api/datasets" > /dev/null 2>&1; then
        test_result 0 "Datasets API endpoint"
    else
        test_result 1 "Datasets API endpoint"
    fi

    # 测试告警 API
    if curl -sf "$BACKEND_URL/api/alerts" > /dev/null 2>&1; then
        test_result 0 "Alerts API endpoint"
    else
        test_result 1 "Alerts API endpoint"
    fi

    # 测试 AI 模型 API
    if curl -sf "$BACKEND_URL/api/iotdb/ai/models" > /dev/null 2>&1; then
        test_result 0 "AI Models API endpoint"
    else
        test_result 1 "AI Models API endpoint"
    fi
}

# AI 功能测试
run_ai_tests() {
    print_header "AI 功能测试"

    echo "检查 AI 模型可用性..."

    # 获取可用模型
    MODELS=$(curl -s "$BACKEND_URL/api/iotdb/ai/models" 2>/dev/null || echo "")

    if [ -n "$MODELS" ]; then
        test_result 0 "AI Models endpoint responds"
        echo "  可用模型: $MODELS"
    else
        test_result 1 "AI Models endpoint"
    fi

    echo ""
    echo "测试 AI 预测功能..."

    # 创建测试时序数据
    TEST_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/iotdb/ai/predict" \
        -H "Content-Type: application/json" \
        -d '{"timeseries": "root.test", "horizon": 5, "algorithm": "arima"}' 2>/dev/null || echo "")

    if [ -n "$TEST_RESPONSE" ]; then
        test_result 0 "AI Predict endpoint responds"
    else
        test_result 1 "AI Predict endpoint"
    fi

    echo ""
    echo "测试异常检测功能..."

    # 测试异常检测
    ANOMALY_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/iotdb/ai/anomalies" \
        -H "Content-Type: application/json" \
        -d '{"timeseries": "root.test", "threshold": 2.5}' 2>/dev/null || echo "")

    if [ -n "$ANOMALY_RESPONSE" ]; then
        test_result 0 "AI Anomaly Detection endpoint responds"
    else
        test_result 1 "AI Anomaly Detection endpoint"
    fi
}

# 数据库连接测试
run_database_tests() {
    print_header "数据库连接测试"

    # 测试 PostgreSQL
    if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
        test_result 0 "PostgreSQL is running"
    else
        test_result 1 "PostgreSQL connection"
    fi

    # 测试 Redis
    if redis-cli ping > /dev/null 2>&1; then
        test_result 0 "Redis is running"
    else
        test_result 1 "Redis connection"
    fi

    # 测试 IoTDB
    if nc -z localhost 6667 2>/dev/null; then
        test_result 0 "IoTDB DataNode is running"
    else
        test_result 1 "IoTDB DataNode connection"
    fi
}

# 完整 AI 测试
run_complete_ai_test() {
    print_header "完整 AI 功能测试"

    echo "此测试将执行完整的 AI 工作流程..."
    echo "（需要预先准备测试数据）"

    # 这里可以添加更完整的 AI 测试逻辑
    # 包括：数据插入 -> 模型训练 -> 预测 -> 异常检测

    echo -e "${YELLOW}注意: 完整 AI 测试需要预先准备时序数据${NC}"
    echo "请参考 docs/DEPLOYMENT.md 中的数据准备步骤"
}

# 显示测试结果摘要
show_summary() {
    print_header "测试结果摘要"

    echo -e "总测试数: $TOTAL_TESTS"
    echo -e "${GREEN}通过: $PASSED_TESTS${NC}"
    echo -e "${RED}失败: $FAILED_TESTS${NC}"
    echo ""

    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}✓ 所有测试通过！${NC}"
        return 0
    else
        echo -e "${RED}✗ 有 $FAILED_TESTS 个测试失败${NC}"
        return 1
    fi
}

# 显示使用说明
show_usage() {
    echo "Usage: $0 [test_type]"
    echo ""
    echo "Test types:"
    echo "  basic     - 运行基础功能测试 (默认)"
    echo "  ai        - 运行 AI 功能测试"
    echo "  database  - 运行数据库连接测试"
    echo "  complete  - 运行完整 AI 测试"
    echo "  all       - 运行所有测试"
    echo ""
    echo "Examples:"
    echo "  $0              # 运行基础测试"
    echo "  $0 ai           # 运行 AI 测试"
    echo "  $0 all          # 运行所有测试"
    exit 1
}

# 主函数
main() {
    TEST_TYPE="${1:-basic}"

    case "$TEST_TYPE" in
        basic)
            run_basic_tests
            show_summary
            ;;
        ai)
            run_ai_tests
            show_summary
            ;;
        database)
            run_database_tests
            show_summary
            ;;
        complete)
            run_complete_ai_test
            ;;
        all)
            run_basic_tests
            run_ai_tests
            run_database_tests
            show_summary
            ;;
        *)
            echo "Unknown test type: $TEST_TYPE"
            show_usage
            ;;
    esac
}

# 运行主函数
main "$@"
