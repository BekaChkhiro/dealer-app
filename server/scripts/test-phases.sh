#!/bin/bash

# Phase 8-10 Testing Script
# Usage: ./scripts/test-phases.sh [phase] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to display help
show_help() {
    cat << EOF
Phase 8-10 Testing Script

Usage: ./scripts/test-phases.sh [command] [options]

Commands:
    all              Run all Phase 8-10 tests
    phase8           Run all Phase 8 tests
    phase8-users     Run Phase 8 Users tests
    phase8-vehicles  Run Phase 8 Vehicles tests
    phase9           Run Phase 9 tests
    phase10          Run Phase 10 tests
    coverage         Run all tests with coverage report
    watch            Run tests in watch mode
    help             Show this help message

Options:
    --verbose        Show detailed test output
    --silent         Minimal output

Examples:
    ./scripts/test-phases.sh all
    ./scripts/test-phases.sh phase8 --verbose
    ./scripts/test-phases.sh coverage
    ./scripts/test-phases.sh phase8-users --watch

EOF
}

# Function to check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_warning "node_modules not found. Installing dependencies..."
        npm install
    fi

    # Check if .env exists
    if [ ! -f ".env" ]; then
        print_error ".env file not found"
        print_info "Please create a .env file with required variables"
        exit 1
    fi

    # Check if database is accessible
    if ! node -e "require('./config/db').query('SELECT 1').then(() => process.exit(0)).catch(() => process.exit(1))" 2>/dev/null; then
        print_error "Cannot connect to database"
        print_info "Please check your DATABASE_URL in .env"
        exit 1
    fi

    print_success "Prerequisites check passed"
}

# Function to run tests
run_tests() {
    local test_file=$1
    local test_name=$2
    local options=$3

    print_info "Running $test_name..."

    if npm test -- $test_file $options; then
        print_success "$test_name passed"
        return 0
    else
        print_error "$test_name failed"
        return 1
    fi
}

# Main script
main() {
    local command=${1:-help}
    local options=""
    local verbose=false
    local watch=false

    # Parse options
    shift || true
    while [[ $# -gt 0 ]]; do
        case $1 in
            --verbose)
                verbose=true
                options="$options --verbose"
                shift
                ;;
            --silent)
                options="$options --silent"
                shift
                ;;
            --watch)
                watch=true
                options="$options --watch"
                shift
                ;;
            *)
                shift
                ;;
        esac
    done

    # Change to server directory
    cd "$(dirname "$0")/.." || exit 1

    case $command in
        help)
            show_help
            exit 0
            ;;

        all)
            check_prerequisites
            print_info "Running all Phase 8-10 tests..."
            echo ""

            local failed=0

            run_tests "phase8-users.test.js" "Phase 8: Users Tests" "$options" || ((failed++))
            echo ""

            run_tests "phase8-vehicles.test.js" "Phase 8: Vehicles Tests" "$options" || ((failed++))
            echo ""

            run_tests "phase9-ports-containers.test.js" "Phase 9: Ports & Containers Tests" "$options" || ((failed++))
            echo ""

            run_tests "phase10-invoices-files.test.js" "Phase 10: Invoices & Files Tests" "$options" || ((failed++))
            echo ""

            if [ $failed -eq 0 ]; then
                print_success "All Phase 8-10 tests passed! 🎉"
                exit 0
            else
                print_error "$failed test suite(s) failed"
                exit 1
            fi
            ;;

        phase8)
            check_prerequisites
            print_info "Running all Phase 8 tests..."
            echo ""

            local failed=0

            run_tests "phase8-users.test.js" "Phase 8: Users Tests" "$options" || ((failed++))
            echo ""

            run_tests "phase8-vehicles.test.js" "Phase 8: Vehicles Tests" "$options" || ((failed++))
            echo ""

            if [ $failed -eq 0 ]; then
                print_success "All Phase 8 tests passed! 🎉"
                exit 0
            else
                print_error "$failed Phase 8 test suite(s) failed"
                exit 1
            fi
            ;;

        phase8-users)
            check_prerequisites
            run_tests "phase8-users.test.js" "Phase 8: Users Tests" "$options"
            ;;

        phase8-vehicles)
            check_prerequisites
            run_tests "phase8-vehicles.test.js" "Phase 8: Vehicles Tests" "$options"
            ;;

        phase9)
            check_prerequisites
            run_tests "phase9-ports-containers.test.js" "Phase 9: Ports & Containers Tests" "$options"
            ;;

        phase10)
            check_prerequisites
            run_tests "phase10-invoices-files.test.js" "Phase 10: Invoices & Files Tests" "$options"
            ;;

        coverage)
            check_prerequisites
            print_info "Running all tests with coverage..."
            npm test -- --coverage --testPathPattern="phase(8|9|10)"
            ;;

        watch)
            check_prerequisites
            print_info "Starting tests in watch mode..."
            print_info "Press 'p' to filter by filename pattern"
            print_info "Press 'q' to quit"
            npm test -- --watch --testPathPattern="phase(8|9|10)"
            ;;

        *)
            print_error "Unknown command: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
