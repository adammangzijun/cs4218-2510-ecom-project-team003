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
              sh 'docker compose down'
              sh 'docker compose build'
              sh 'docker compose up -d'
            }
        }
    }
}
