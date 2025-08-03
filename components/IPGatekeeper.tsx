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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
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
    setAiDetection(null); // Reset previous detection
    
    // Create image preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Start AI detection with loading
    setIsDetecting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const detection = await detectAI(buffer);
      setAiDetection(detection);

      if (detection.isAI) {
        setLicenseSettings(prev => ({ ...prev, aiLearning: false }));
      }
    } catch (error) {
      console.error('AI detection failed:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleCancelUpload = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setAiDetection(null);
    setIsDetecting(false);
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const registerIP = async () => {
    if (!storyClient || !selectedFile || !address) return;
    setIsRegistering(true);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const imageCid = await uploadToIPFS(buffer, selectedFile.name);
      
      const imageUrl = `https://ipfs.io/ipfs/${imageCid}`;

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

      const offChainTerms = {
        territory: "Global",
        channelsOfDistribution: "All channels",
        attribution: true,
        contentStandards: ["No-Hate", "Suitable-for-All-Ages"],
        sublicensable: false,
        aiLearningModels: licenseSettings.aiLearning,
        restrictionOnCrossPlatformUse: false,
        governingLaw: "California, USA",
        alternativeDisputeResolution: "Alternative-Dispute-Resolution",
        additionalParameters: aiDetection?.isAI ? 
          "This AI-generated content is explicitly prohibited from being used for AI training or machine learning purposes." :
          "This content may be restricted from AI training purposes based on creator preferences."
      };

      const ipMetadataCid = await uploadToIPFS(JSON.stringify(ipMetadata), 'metadata.json');
      const nftMetadataCid = await uploadToIPFS(JSON.stringify(nftMetadata), 'nft-metadata.json');
      const offChainTermsCid = await uploadToIPFS(JSON.stringify(offChainTerms), 'license-terms.json');

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
            commercializerCheckerData: "0x",
            commercialRevShare: licenseSettings.revShare,
            commercialRevCeiling: BigInt(0),
            derivativesAllowed: true,
            derivativesAttribution: true,
            derivativesApproval: false,
            derivativesReciprocal: true,
            derivativeRevCeiling: BigInt(0),
            currency: "0x1514000000000000000000000000000000000000",
            uri: `https://ipfs.io/ipfs/${offChainTermsCid}`,
          },
          licensingConfig: {
            isSet: false,
            mintingFee: BigInt(0),
            licensingHook: "0x0000000000000000000000000000000000000000",
            hookData: "0x",
            commercialRevShare: 0,
            disabled: false,
            expectMinimumGroupRewardShare: 0,
            expectGroupRewardPool: "0x0000000000000000000000000000000000000000",
          }
        }],
        ipMetadata: {
          ipMetadataURI: `https://ipfs.io/ipfs/${ipMetadataCid}`,
          ipMetadataHash: `0x${createHash('sha256').update(JSON.stringify(ipMetadata)).digest('hex')}`,
          nftMetadataURI: `https://ipfs.io/ipfs/${nftMetadataCid}`,
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
      {/* Upload Section - Segi empat dengan preview langsung */}
      <div className="relative">
        <div className="w-full h-80 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
          {!imagePreview ? (
            // Upload area ketika belum ada gambar
            <div className="h-full flex flex-col items-center justify-center cursor-pointer">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              />
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-2xl">📁</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Choose Image File</h3>
                <p className="text-gray-500">Click here or drag and drop your image</p>
                <p className="text-sm text-gray-400 mt-1">Supports JPG, PNG, GIF</p>
              </div>
            </div>
          ) : (
            // Preview area ketika sudah ada gambar
            <div className="relative h-full">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full h-full object-cover rounded-lg"
              />
              
              {/* Loading overlay saat AI detection */}
              {isDetecting && (
                <div className="absolute inset-0 bg-black bg-opacity-60 rounded-lg flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm font-medium">Analyzing image...</p>
                    <p className="text-xs opacity-80">Detecting AI content</p>
                  </div>
                </div>
              )}
              
              {/* Cancel button */}
              <button
                onClick={handleCancelUpload}
                className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors duration-200"
                title="Remove image"
              >
                <span className="text-sm font-bold">×</span>
              </button>
              
              {/* File info */}
              <div className="absolute bottom-3 left-3 bg-black bg-opacity-60 text-white px-3 py-1 rounded-lg text-sm">
                {selectedFile?.name}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Detection Result */}
      {aiDetection && (
        <div className={`p-4 rounded-lg ${aiDetection.isAI ? 'bg-red-100' : 'bg-green-100'}`}>
          <div className="flex items-center space-x-2 mb-2">
            <span className={`text-lg ${aiDetection.isAI ? '⚠️' : '✅'}`}></span>
            <h3 className="font-semibold">AI Detection Result</h3>
          </div>
          <p className="mb-2">Status: {aiDetection.isAI ? 'AI-Generated' : 'Original'}</p>
          <div className="flex items-center space-x-3">
            <span className="text-sm">Confidence:</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-1000 ${
                  aiDetection.isAI ? 'bg-red-500' : 'bg-green-500'
                }`}
                style={{ width: `${aiDetection.confidence * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium">{(aiDetection.confidence * 100).toFixed(1)}%</span>
          </div>
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
        disabled={!selectedFile || !title || isRegistering || isDetecting}
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
