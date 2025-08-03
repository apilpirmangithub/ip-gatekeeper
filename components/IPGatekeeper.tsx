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
      <div className="text-center p-12">
        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center animate-spin">
          <span className="text-white text-2xl">📁</span>
        </div>
        <p className="text-xl text-gray-600">Connect wallet to continue</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* File Upload */}
      <div className="border-2 border-dashed border-blue-300 rounded-2xl p-8 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 cursor-pointer">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
            <span className="text-white text-2xl">📁</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Upload Image</h3>
          <p className="text-gray-600">Click or drag to select</p>
        </div>
      </div>
      
      {selectedFile && (
        <div className="p-4 bg-white rounded-xl shadow-lg border border-green-200">
          <div className="flex items-center space-x-3">
            <span className="text-green-500 text-xl">✅</span>
            <span className="text-green-700 font-medium">{selectedFile.name}</span>
          </div>
        </div>
      )}

      {/* AI Detection */}
      {aiDetection && (
        <div className={`p-6 rounded-2xl shadow-lg ${
          aiDetection.isAI 
            ? 'bg-gradient-to-r from-red-50 to-orange-50 border border-red-200' 
            : 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'
        }`}>
          <div className="flex items-center space-x-3 mb-3">
            <span className={`text-2xl ${aiDetection.isAI ? '⚠️' : '✅'}`}></span>
            <h3 className="text-lg font-semibold">AI Detection</h3>
          </div>
          <div className="space-y-2">
            <p className="text-gray-700">
              Status: {aiDetection.isAI ? 'AI-Generated' : 'Original'}
            </p>
            <div className="flex items-center space-x-3">
              <span className="font-medium text-gray-700">Confidence:</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    aiDetection.isAI ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${aiDetection.confidence * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium">
                {(aiDetection.confidence * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              placeholder="Enter title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              placeholder="Enter description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-xl h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
            />
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">License Settings</h3>
          
          <div className="space-y-4">
            <label className="flex items-center space-x-3 cursor-pointer hover:translate-x-1 transition-transform">
              <input
                type="checkbox"
                checked={licenseSettings.commercialUse}
                onChange={(e) => setLicenseSettings(prev => ({ ...prev, commercialUse: e.target.checked }))}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Commercial Use</span>
            </label>
            
            <label className="flex items-center space-x-3 cursor-pointer hover:translate-x-1 transition-transform">
              <input
                type="checkbox"
                checked={licenseSettings.aiLearning}
                onChange={(e) => setLicenseSettings(prev => ({ ...prev, aiLearning: e.target.checked }))}
                disabled={aiDetection?.isAI}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
              />
              <span className={`text-gray-700 ${aiDetection?.isAI ? 'opacity-50' : ''}`}>
                AI Learning {aiDetection?.isAI && '(Disabled)'}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Register Button */}
      <button
        onClick={registerIP}
        disabled={!selectedFile || !title || isRegistering}
        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-2xl font-semibold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:scale-105 transition-all duration-300"
      >
        <div className="flex items-center justify-center space-x-3">
          {isRegistering ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Registering...</span>
            </>
          ) : (
            <>
              <span className="text-xl">✅</span>
              <span>Register IP Asset</span>
            </>
          )}
        </div>
      </button>

      {/* Success */}
      {result && (
        <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 shadow-lg">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">🎉</span>
            <h3 className="text-xl font-semibold text-green-800">Success!</h3>
          </div>
          <div className="space-y-2">
            <p className="text-green-700">IP Asset registered successfully!</p>
            <div className="text-sm space-y-1">
              <p className="break-all">
                <span className="font-medium">TX:</span> {result.txHash}
              </p>
              <p className="break-all">
                <span className="font-medium">IP ID:</span> {result.ipId}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
