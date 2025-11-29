pipeline {
    agent any

    environment {
        BUILD_TAG = "build-${BUILD_NUMBER}"
    }

    stages {
        stage('Start') {
            steps {
                echo "🚀 Starting Pipeline Build #${env.BUILD_NUMBER}"
            }
        }

        stage('1. Checkout') {
            steps {
                script {
                    // Vérifie si SCM est défini, sinon ignore ou utilise git direct
                    try {
                        checkout scm
                    } catch (Exception e) {
                        echo "⚠️ Pas de SCM détecté (Mode test manuel ?). Assurez-vous que les fichiers sont là."
                        // Optionnel: git 'https://github.com/votre/repo.git'
                    }
                }
            }
        }

        stage('2. Cleanup & Setup') {
            steps {
                // Version simplifiée qui ne plante pas si rien n'est trouvé
                bat '''
                    @echo off
                    echo [Setup] Cleaning ports...
                    docker-compose down -v --remove-orphans >nul 2>&1
                    exit /b 0
                '''
            }
        }

        stage('3. Build & Run') {
            steps {
                bat """
                    @echo off
                    echo 🏗️ Building and Starting...
                    docker-compose up -d --build
                    if errorlevel 1 exit /b 1
                """
                echo "⏳ Waiting 30s for startup..."
                sleep 30
            }
        }

        stage('4. Smoke Test (Safe Mode)') {
            steps {
                script {
                    // Utilisation de la commande powershell directe si le plugin est dispo, sinon bat simplifié
                    def psCmd = 'try { $res = Invoke-RestMethod "http://localhost:8081/api.php" -ErrorAction Stop; if($res) { exit 0 } else { exit 1 } } catch { Write-Host $_; exit 1 }'
                    
                    // On écrit la commande dans un fichier temporaire pour éviter les problèmes de guillemets/batch
                    writeFile file: 'test_backend.ps1', text: psCmd
                    
                    echo "🧪 Testing Backend..."
                    def status = bat(returnStatus: true, script: 'powershell -ExecutionPolicy Bypass -File test_backend.ps1')
                    
                    if (status != 0) {
                        currentBuild.result = 'FAILURE'
                        error "❌ Smoke Test Failed: Backend not responding."
                    } else {
                        echo "✅ Backend OK"
                    }
                }
            }
        }
    }
    
    post {
        always {
            bat 'docker-compose down -v >nul 2>&1'
        }
    }
}