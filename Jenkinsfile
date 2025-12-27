pipeline {
    agent { dockerfile true }
    stages {
        stage('Test') {
            steps {
                sh 'curl http://localhost:6060'
            }
        }
    }
}
