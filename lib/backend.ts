// lib/backend.ts
import { uploadToIPFS, detectAI } from '../services';
import { createHash } from 'crypto';
import { StoryClient } from '@story-protocol/core-sdk';

export async function processFile(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const imagePreview = URL.createObjectURL(file);
  const aiDetection = await detectAI(buffer);
  return { buffer, imagePreview, aiDetection };
}

export async function uploadMetadataAndRegister({
  storyClient,
  file,
  address,
  title,
  description,
  aiDetection,
  licenseSettings
}: {
  storyClient: StoryClient;
  file: File;
  address: string;
  title: string;
  description: string;
  aiDetection: any;
  licenseSettings: any;
}) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const imageCid = await uploadToIPFS(buffer, file.name);
  const imageUrl = `https://ipfs.io/ipfs/${imageCid}`;

  const ipMetadata = {
    title,
    description,
    image: imageUrl,
    mediaUrl: imageUrl,
    mediaType: file.type,
    creators: [{ name: "User", address, contributionPercent: 100 }],
    ...(aiDetection?.isAI && {
      tags: ["AI-generated"],
      aiGenerated: true,
      aiConfidence: aiDetection.confidence,
    }),
  };

  const nftMetadata = {
    name: `${title} NFT`,
    description: `NFT representing ${title}`,
    image: imageUrl,
    attributes: [
      { trait_type: "Type", value: aiDetection?.isAI ? "AI-generated" : "Original" },
      { trait_type: "License Type", value: licenseSettings.pilType },
      { trait_type: "AI Learning Allowed", value: licenseSettings.aiLearning ? "Yes" : "No" },
      { trait_type: "Commercial Use", value: licenseSettings.commercialUse ? "Yes" : "No" },
      ...(licenseSettings.commercialUse ? [{ trait_type: "Revenue Share", value: `${licenseSettings.revShare}%` }] : []),
      { trait_type: "Territory", value: licenseSettings.territory },
    ],
  };

  const ipMetadataCid = await uploadToIPFS(JSON.stringify(ipMetadata), 'metadata.json');
  const nftMetadataCid = await uploadToIPFS(JSON.stringify(nftMetadata), 'nft-metadata.json');

  const hash = (data: string) => `0x${createHash('sha256').update(data).digest('hex')}`;

  const payload = {
    ipMetadataURI: `https://ipfs.io/ipfs/${ipMetadataCid}`,
    ipMetadataHash: hash(JSON.stringify(ipMetadata)),
    nftMetadataURI: `https://ipfs.io/ipfs/${nftMetadataCid}`,
    nftMetadataHash: hash(JSON.stringify(nftMetadata)),
  };

  return { imageUrl, payload };
}
