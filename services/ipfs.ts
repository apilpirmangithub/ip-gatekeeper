export async function uploadToIPFS(data: Buffer | string, fileName: string): Promise<string> {
  const formData = new FormData();

  if (typeof data === 'string') {
    const blob = new Blob([data], { type: 'application/json' });
    formData.append('file', blob, fileName);
  } else {
    // Convert Buffer to Uint8Array for better compatibility
    const uint8Array = new Uint8Array(data);
    const blob = new Blob([uint8Array], { type: 'application/octet-stream' });
    formData.append('file', blob, fileName);
  }

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload to IPFS');
  }

  const result = await response.json();
  return result.IpfsHash;
}
