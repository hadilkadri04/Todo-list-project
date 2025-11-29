pipeline {
    agent any

    environment {
        // Optionnel : Force l'utilisation de Docker via TCP si nécessaire
        // DOCKER_HOST = 'tcp://localhost:2375'
    }

    stages {
        stage('1. Checkout') {
            steps {
                // Récupère le code depuis GitHub
                checkout scm
            }
        }

        stage('2. Cleanup & Setup') {
            steps {
                script {
                    echo "🧹 Cleaning up old containers..."
                    // Supprime les anciens conteneurs et volumes pour partir de zéro
                    bat 'docker-compose down -v --remove-orphans'
                }
            }
        }

        stage('3. Build & Run') {
            steps {
                script {
                    echo "🏗️ Building and Starting..."
                    // Lance la construction et le démarrage en arrière-plan
                    bat 'docker-compose up -d --build'
                    
                    echo "⏳ Waiting 30s for database initialization..."
                    sleep 30 // Pause pour laisser le temps à MySQL de démarrer
                }
            }
        }

        stage('4. Smoke Test') {
            steps {
                script {
                    echo "🧪 Testing connectivity..."

                    // --- TEST BACKEND (Port 8085) ---
                    // On crée un script PowerShell temporaire pour tester le backend
                    writeFile file: 'test_backend.ps1', text: '''
                        try {
                            $response = Invoke-WebRequest -Uri "http://localhost:8085" -Method Head -TimeoutSec 5 -ErrorAction Stop
                            if ($response.StatusCode -eq 200) { 
                                Write-Host "✅ Backend is UP!" 
                                exit 0 
                            }
                            else { 
                                Write-Host "❌ Backend returned status: $($response.StatusCode)" 
                                exit 1 
                            }
                        } catch {
                            Write-Host "❌ Backend unreachable: $_"
                            exit 1
                        }
                    '''
                    // On exécute le script
                    bat 'powershell -ExecutionPolicy Bypass -File test_backend.ps1'

                    // --- TEST FRONTEND (Port 8090) ---
                    // On crée un script PowerShell temporaire pour tester le frontend
                    writeFile file: 'test_frontend.ps1', text: '''
                        try {
                            $response = Invoke-WebRequest -Uri "http://localhost:8090" -Method Head -TimeoutSec 5 -ErrorAction Stop
                            if ($response.StatusCode -eq 200) { 
                                Write-Host "✅ Frontend is UP!" 
                                exit 0 
                            }
                            else { 
                                Write-Host "❌ Frontend returned status: $($response.StatusCode)" 
                                exit 1 
                            }
                        } catch {
                            Write-Host "❌ Frontend unreachable: $_"
                            exit 1
                        }
                    '''
                    // On exécute le script
                    bat 'powershell -ExecutionPolicy Bypass -File test_frontend.ps1'
                }
            }
        }
    }

    post {
        always {
            script {
                echo "🏁 Final Cleanup..."
                // Nettoyage final pour ne pas laisser tourner les conteneurs
                bat 'docker-compose down -v'
            }
        }
        success {
            echo "✅ Pipeline succeeded! The application works on ports 8085 and 8090."
        }
        failure {
            echo "❌ Pipeline failed. Please check the logs."
        }
    }
}