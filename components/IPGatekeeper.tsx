"use client";
import { useState, useEffect } from 'react';
import { useWalletClient, useAccount } from 'wagmi';
import { custom } from 'viem';
import { createHash } from 'crypto';
import { StoryClient, StoryConfig } from '@story-protocol/core-sdk';
import { uploadToIPFS, detectAI } from '../services';

export default function IPGatekeeper() {
  const { data: wallet } = useWalletClient();
  const { address, isConnected } = useAccount();
  const [storyClient, setStoryClient] = useState<StoryClient | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [aiDetection, setAiDetection] = useState<{ isAI: boolean; confidence: number } | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [licenseSettings, setLicenseSettings] = useState({
    commercialUse: false,
    revShare: 0,
    aiLearning: true,
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (wallet && isConnected) {
      const config: StoryConfig = {
        wallet: wallet,
        transport: custom(wallet.transport),
        chainId: "aeneid",
      };
      setStoryClient(StoryClient.newClient(config));
    }
  }, [wallet, isConnected]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const detection = await detectAI(buffer);
    setAiDetection(detection);

    if (detection.isAI) {
      setLicenseSettings(prev => ({ ...prev, aiLearning: false }));
    }
  };

  const registerIP = async () => {
    if (!storyClient || !selectedFile || !address) return;
    setIsRegistering(true);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const imageCid = await uploadToIPFS(buffer, selectedFile.name);
      const imageUrl = `${process.env.NEXT_PUBLIC_PINATA_GATEWAY}/files/${imageCid}`;

      const ipMetadata = {
        title,
        description,
        image: imageUrl,
        mediaUrl: imageUrl,
        mediaType: selectedFile.type,
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
          { trait_type: "AI Learning Allowed", value: licenseSettings.aiLearning ? "Yes" : "No" },
        ],
      };

      const ipMetadataCid = await uploadToIPFS(JSON.stringify(ipMetadata), 'metadata.json');
      const nftMetadataCid = await uploadToIPFS(JSON.stringify(nftMetadata), 'nft-metadata.json');

      const response = await storyClient.ipAsset.mintAndRegisterIpAssetWithPilTerms({
        spgNftContract: "0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc",
        licenseTermsData: [{
          terms: {
            transferable: true,
            royaltyPolicy: "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E",
            defaultMintingFee: BigInt(0),
            expiration: BigInt(0),
            commercialUse: licenseSettings.commercialUse,
            commercialAttribution: true,
            commercializerChecker: "0x0000000000000000000000000000000000000000",
            commercializerCheckerData: "0x0000000000000000000000000000000000000000",
            commercialRevShare: licenseSettings.revShare,
            commercialRevCeiling: BigInt(0),
            derivativesAllowed: true,
            derivativesAttribution: true,
            derivativesApproval: false,
            derivativesReciprocal: true,
            derivativeRevCeiling: BigInt(0),
            currency: "0x1514000000000000000000000000000000000000",
            uri: "",
          }
        }],
        ipMetadata: {
          ipMetadataURI: `${process.env.NEXT_PUBLIC_PINATA_GATEWAY}/files/${ipMetadataCid}`,
          ipMetadataHash: `0x${createHash('sha256').update(JSON.stringify(ipMetadata)).digest('hex')}`,
          nftMetadataURI: `${process.env.NEXT_PUBLIC_PINATA_GATEWAY}/files/${nftMetadataCid}`,
          nftMetadataHash: `0x${createHash('sha256').update(JSON.stringify(nftMetadata)).digest('hex')}`,
        }
      });

      setResult(response);
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setIsRegistering(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center p-8">
        <p className="text-lg text-gray-600">Please connect your wallet to continue.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <input type="file" accept="image/*" onChange={handleFileUpload} className="w-full" />
        {selectedFile && <p className="mt-2 text-sm text-gray-600">Selected: {selectedFile.name}</p>}
      </div>

      {aiDetection && (
        <div className={`p-4 rounded-lg ${aiDetection.isAI ? 'bg-red-100' : 'bg-green-100'}`}>
          <h3 className="font-semibold">AI Detection Result:</h3>
          <p>Status: {aiDetection.isAI ? 'AI-Generated' : 'Original'}</p>
          <p>Confidence: {(aiDetection.confidence * 100).toFixed(1)}%</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 border rounded-lg"
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 border rounded-lg h-32"
          />
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold">License Settings</h3>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={licenseSettings.commercialUse}
              onChange={(e) => setLicenseSettings(prev => ({ ...prev, commercialUse: e.target.checked }))}
            />
            <span>Allow Commercial Use</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={licenseSettings.aiLearning}
              onChange={(e) => setLicenseSettings(prev => ({ ...prev, aiLearning: e.target.checked }))}
              disabled={aiDetection?.isAI}
            />
            <span>Allow AI Learning {aiDetection?.isAI && '(Disabled - AI Detected)'}</span>
          </label>
        </div>
      </div>

      <button
        onClick={registerIP}
        disabled={!selectedFile || !title || isRegistering}
        className="w-full bg-blue-500 text-white p-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600"
      >
        {isRegistering ? 'Registering IP Asset...' : 'Register IP Asset'}
      </button>

      {result && (
        <div className="p-4 bg-green-100 rounded-lg">
          <h3 className="font-semibold text-green-800">Success!</h3>
          <p className="text-sm">IP Asset registered successfully!</p>
          <p className="text-xs break-all">Transaction: {result.txHash}</p>
          <p className="text-xs break-all">IP ID: {result.ipId}</p>
        </div>
      )}
    </div>
  );
}
