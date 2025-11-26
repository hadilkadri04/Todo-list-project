pipeline {
    agent any
    stages {

        /* ============================
           1. CHECKOUT
        ============================ */
        stage('1. Checkout') {
            steps {
                echo "📦 Pulling latest code..."
                checkout scm
            }
        }

        /* ============================
           2. SETUP (Fully Fixed)
        ============================ */
        stage('2. Setup') {
            steps {
                echo "🔧 Ensuring ports 8081 and 8888 are free..."
                bat '''
                    @echo off
                    setlocal enabledelayedexpansion

                    echo • Releasing port 8081 (backend)...
                    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081 ^| findstr LISTENING') do (
                        taskkill /F /PID %%a 2>nul || echo (ignored)
                    )

                    echo • Releasing port 8888 (frontend)...
                    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8888 ^| findstr LISTENING') do (
                        taskkill /F /PID %%a 2>nul || echo (ignored)
                    )

                    echo • Removing leftover containers...
                    for /f "tokens=*" %%i in ('docker ps -aq --filter "name=todolist-"') do (
                        docker rm -f %%i 2>nul || echo (ignored)
                    )

                    echo • Removing volumes...
                    docker volume prune -f 2>nul || echo (ignored)
                '''
                echo "✅ Setup complete"
            }
        }

        /* ============================
           3. BUILD BACKEND
        ============================ */
        stage('3. Build Backend') {
            steps {
                echo "⚙️ Building backend image..."
                bat '''
                    docker build -t todolist-backend ./backend || exit /b 1
                '''
            }
        }

        /* ============================
           4. BUILD FRONTEND
        ============================ */
        stage('4. Build Frontend') {
            steps {
                echo "⚙️ Building frontend image..."
                bat '''
                    docker build -t todolist-frontend ./frontend || exit /b 1
                '''
            }
        }

        /* ============================
           5. START SERVICES
        ============================ */
        stage('5. Start Containers') {
            steps {
                echo "🚀 Starting containers with docker compose..."
                bat '''
                    docker compose down -v --remove-orphans 2>nul || echo (ignored)
                    docker compose up -d || exit /b 1
                '''
            }
        }
    }

    /* ============================
       ALWAYS CLEANUP
    ============================ */
    post {
        always {
            echo "🧹 Cleaning environment..."

            bat '''
                @echo off
                echo Stopping containers...
                docker compose down -v --remove-orphans 2>nul || echo (ignored)

                echo Removing any leftover 'todolist-' containers...
                for /f "tokens=*" %%i in ('docker ps -aq --filter "name=todolist-"') do (
                    docker rm -f %%i 2>nul || echo (ignored)
                )

                echo Pruning unused volumes...
                docker volume prune -f 2>nul || echo (ignored)
            '''

            echo "✅ Cleanup finished"
        }
    }
}
