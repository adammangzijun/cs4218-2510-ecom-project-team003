pipeline {
    agent any

    stages {

        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Rebuild & Restart Containers') {
            steps {
              powershell 'docker compose down'
              powershell 'docker compose build'
              powershell 'docker compose up -d'
            }
        }
    }
}
