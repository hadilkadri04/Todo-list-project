pipeline {
    agent any

    parameters {
        choice(name: 'MODE_PIPELINE', choices: ['DEV_PUSH', 'PULL_REQUEST', 'RELEASE_TAG'],
         description: 'Choisissez le type de pipeline à simuler')
        string(name: 'VERSION_TAG', defaultValue: 'v1.0.0', description: 'Si mode RELEASE, indiquez la version (ex: v1.0.0)')
    }

    stages {
        stage('1. Checkout') {
            steps {
                script {
                    echo "🚀 Démarrage du Pipeline en mode : ${params.MODE_PIPELINE}"
                    checkout scm
                }
            }
        }

        stage('2. Setup') {
            steps {
                script {
                    echo "🧹 Nettoyage de l'environnement..."
                    bat 'docker-compose down -v --remove-orphans'
                }
            }
        }

        stage('3. Build') {
            parallel {
                stage('Build Backend') {
                    steps {
                        echo "🏗️ Construction Backend..."
                        bat 'docker-compose build backend'
                    }
                }
                stage('Build Frontend') {
                    steps {
                        echo "🏗️ Construction Frontend..."
                        bat 'docker-compose build frontend'
                    }
                }
            }
        }

        stage('4. Run') {
            steps {
                script {
                    echo "🚀 Démarrage des conteneurs..."
                    bat 'docker-compose up -d'
                    echo "⏳ Attente 30s..."
                    sleep 30
                }
            }
        }

        stage('5. Smoke Test') {
            steps {
                script {
                    echo "🧪 Préparation des tests..."
                    
                    // Création des scripts de test (Ports 8085 et 8090)
                    writeFile file: 'test_back.ps1', text: '''
                        try {
                            $r = Invoke-WebRequest -Uri "http://localhost:8085" -Method Head -TimeoutSec 5 -ErrorAction Stop
                            if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 }
                        } catch { exit 1 }
                    '''
                    writeFile file: 'test_front.ps1', text: '''
                        try {
                            $r = Invoke-WebRequest -Uri "http://localhost:8090" -Method Head -TimeoutSec 5 -ErrorAction Stop
                            if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 }
                        } catch { exit 1 }
                    '''
                    
                    echo "🧪 Lancement des tests en parallèle..."
                    
                    // CORRECTION ICI : Syntaxe parallel compatible avec 'script'
                    parallel(
                        "Test Back": {
                            bat 'powershell -ExecutionPolicy Bypass -File test_back.ps1'
                        },
                        "Test Front": {
                            bat 'powershell -ExecutionPolicy Bypass -File test_front.ps1'
                        }
                    )
                }
            }
        }

        stage('6. Archive & Result') {
            steps {
                script {
                    def reportName = "rapport_build.txt"
                    writeFile file: reportName, text: "Rapport du Build ${env.BUILD_NUMBER} - Mode: ${params.MODE_PIPELINE}"

                    if (params.MODE_PIPELINE == 'PULL_REQUEST') {
                        echo "🔵 SCÉNARIO 1 : PULL REQUEST - Tests validés."
                        archiveArtifacts artifacts: reportName
                    } 
                    else if (params.MODE_PIPELINE == 'DEV_PUSH') {
                        echo "🟠 SCÉNARIO 2 : PUSH SUR DEV - Environnement à jour."
                        archiveArtifacts artifacts: reportName
                    } 
                    else if (params.MODE_PIPELINE == 'RELEASE_TAG') {
                        echo "🟢 SCÉNARIO 3 : RELEASE VERSIONNÉE (${params.VERSION_TAG})"
                        archiveArtifacts artifacts: reportName, fingerprint: true
                    }
                }
            } 
        }
    }

    post {
        always {
            script {
                echo "🏁 Nettoyage final..."
                bat 'docker-compose down -v'
            }
        }
    }
}