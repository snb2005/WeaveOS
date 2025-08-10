const axios = require('axios');
const FormData = require('form-data');

const API_BASE = 'http://localhost:3001/api';

const sampleFiles = [
  { 
    name: 'welcome.txt', 
    path: '/Desktop', 
    content: 'Welcome to Weave OS!\n\nThis is a virtual file system running on MongoDB GridFS.\nYou can use the terminal to navigate and manage files.\n\nTry these commands:\n- ls (list files)\n- cd (change directory)\n- cat (view file contents)\n- mkdir (create directory)\n- touch (create file)\n\nHave fun exploring!' 
  },
  { 
    name: 'readme.md', 
    path: '/Documents', 
    content: '# Weave OS Documentation\n\n## Overview\nWeave OS is a browser-based operating system with:\n- Virtual file system\n- Terminal emulation\n- Text editor\n- File manager\n\n## Features\n- GridFS file storage\n- Real-time file operations\n- Cross-component synchronization\n\n## Commands\n```bash\nls -la          # List files with details\ncd /Documents   # Change directory\ncat readme.md   # View file contents\ntree           # Show directory tree\n```' 
  },
  { 
    name: 'todo.txt', 
    path: '/Documents/Notes', 
    content: 'TODO List\n=========\n\n[x] Implement GridFS file storage\n[x] Create terminal emulation\n[x] Add file manager\n[x] Build text editor\n[ ] Add file permissions\n[ ] Implement file search\n[ ] Add syntax highlighting\n[ ] Create plugin system\n\nNotes:\n- GridFS working perfectly\n- Terminal integration complete\n- All file operations functional' 
  },
  { 
    name: 'hello.js', 
    path: '/Documents/Scripts', 
    content: '#!/usr/bin/env node\n\n// Hello World script for Weave OS\nconsole.log("Hello from Weave OS!");\nconsole.log("Current time:", new Date().toISOString());\nconsole.log("Platform: Browser-based OS");\nconsole.log("Storage: MongoDB GridFS");\n\n// Example function\nfunction greetUser(name) {\n    return `Welcome to Weave OS, ${name}!`;\n}\n\nconsole.log(greetUser("Developer"));' 
  }
];

async function createSampleFilesViaAPI() {
  try {
    console.log('📝 Creating sample files via API...');
    
    // First, get auth token (simulate login)
    let authToken = '';
    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        username: 'snb',
        password: 'password'
      });
      authToken = loginResponse.data.token;
      console.log('✅ Authenticated successfully');
    } catch (error) {
      console.log('⚠️ No auth needed or login failed, proceeding without token');
    }
    
    const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
    
    for (const file of sampleFiles) {
      try {
        // Check if file already exists
        const listResponse = await axios.get(`${API_BASE}/files`, {
          params: { path: file.path },
          headers
        });
        
        const existingFile = listResponse.data.files?.find(f => f.filename === file.name);
        if (existingFile) {
          console.log(`📄 File already exists: ${file.path}/${file.name}`);
          continue;
        }
        
        // Create form data for file upload
        const formData = new FormData();
        formData.append('file', Buffer.from(file.content), {
          filename: file.name,
          contentType: 'text/plain'
        });
        formData.append('path', file.path);
        
        // Upload the file
        const uploadResponse = await axios.post(`${API_BASE}/files/upload`, formData, {
          headers: {
            ...headers,
            ...formData.getHeaders()
          }
        });
        
        console.log(`✅ Created file: ${file.path}/${file.name} (${file.content.length} bytes)`);
        
      } catch (error) {
        console.error(`❌ Failed to create ${file.path}/${file.name}:`, error.response?.data || error.message);
      }
    }
    
    console.log('🎉 Sample file creation completed!');
    
    // List root directory to verify
    try {
      const rootResponse = await axios.get(`${API_BASE}/files`, {
        params: { path: '/' },
        headers
      });
      
      console.log('\n📁 Root directory contents:');
      rootResponse.data.files?.forEach(file => {
        const type = file.isDirectory ? 'folder' : 'file';
        console.log(`  ${file.filename} (${type})`);
      });
    } catch (error) {
      console.log('⚠️ Could not list root directory');
    }
    
  } catch (error) {
    console.error('❌ Error creating sample files:', error.message);
  }
}

createSampleFilesViaAPI();
