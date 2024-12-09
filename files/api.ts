export const addDocument = async (formData: FormData) => {
  const response = await fetch('/api/documents/upload', {
    method: 'POST',
    headers: {
      // Remove any Content-Type header here
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  return response.json();
};
