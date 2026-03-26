import React from 'react'
import ReactDOM from 'react-dom/client'
import { Amplify } from 'aws-amplify'
import { awsConfig } from './amplify-config'
import App from './App'
import './index.css'

// Configure AWS Amplify
Amplify.configure(awsConfig, { ssr: false })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
