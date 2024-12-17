// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  const uploadForm = document.getElementById('uploadForm');
  const fileList = document.getElementById('fileList');

  // File upload handling
  if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fileInput = document.getElementById('fileInput');
      const file = fileInput.files[0];
      if (!file) {
        alert('Please select a file to upload');
        return;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('http://localhost:3000/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          alert('File uploaded successfully!');
          console.log('Upload Response:', result);
          await loadFiles(); // Refresh the file list
        } else {
          const error = await response.text();
          alert('File upload failed: ' + error);
          console.error('Upload Error:', error);
        }
      } catch (error) {
        console.error('Fetch Error:', error);
        alert('An error occurred during the upload');
      }
    });
  } else {
    console.error('uploadForm element not found');
  }

  // Load the file list
  async function loadFiles() {
    try {
      const response = await fetch('http://localhost:3000/files');
      if (response.ok) {
        const files = await response.json();
        console.log('Files:', files);
        fileList.innerHTML = ''; // Clear the existing list
        files.forEach((file) => {
          const li = document.createElement('li');
          li.textContent = `${file.name} - ${file.s3Path}`;
          fileList.appendChild(li);
        });
      } else {
        console.error('Failed to fetch file list');
      }
    } catch (error) {
      console.error('Fetch Error:', error);
    }
  }

  // Load the file list when the page loads
  loadFiles();
});