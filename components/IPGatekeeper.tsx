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
    derivativesAllowed: true,
    derivativesAttribution: true,
    attribution: true,
    transferable: true,
    aiLearning: true,
    expiration: 'never',
    territory: 'global',
    customTerritory: '',
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

  const getExpirationTimestamp = (expiration: string): number => {
    const now = Date.now() / 1000; // Current timestamp in seconds
    switch (expiration) {
      case '1year': return now + (365 * 24 * 60 * 60);
      case '2years': return now + (2 * 365 * 24 * 60 * 60);
      case '5years': return now + (5 * 365 * 24 * 60 * 60);
      case '10years': return now + (10 * 365 * 24 * 60 * 60);
      default: return 0;
    }
  };

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
          { trait_type: "Commercial Use", value: licenseSettings.commercialUse ? "Yes" : "No" },
          { trait_type: "Revenue Share", value: `${licenseSettings.revShare}%` },
          { trait_type: "Territory", value: licenseSettings.territory === 'custom' ? licenseSettings.customTerritory : licenseSettings.territory },
          { trait_type: "Expiration", value: licenseSettings.expiration },
        ],
      };

      const offChainTerms = {
        territory: licenseSettings.territory === 'custom' ? licenseSettings.customTerritory : licenseSettings.territory,
        channelsOfDistribution: "All channels",
        attribution: licenseSettings.attribution,
        contentStandards: ["No-Hate", "Suitable-for-All-Ages"],
        sublicensable: false,
        aiLearningModels: licenseSettings.aiLearning,
        restrictionOnCrossPlatformUse: false,
        governingLaw: "California, USA",
        alternativeDisputeResolution: "Alternative-Dispute-Resolution",
        commercialUse: licenseSettings.commercialUse,
        commercialRevShare: licenseSettings.revShare,
        derivativesAllowed: licenseSettings.derivativesAllowed,
        derivativesAttribution: licenseSettings.derivativesAttribution,
        transferable: licenseSettings.transferable,
        expiration: licenseSettings.expiration,
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
            transferable: licenseSettings.transferable,
            royaltyPolicy: "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E",
            defaultMintingFee: BigInt(0),
            expiration: licenseSettings.expiration === 'never' ? BigInt(0) : BigInt(getExpirationTimestamp(licenseSettings.expiration)),
            commercialUse: licenseSettings.commercialUse,
            commercialAttribution: licenseSettings.attribution,
            commercializerChecker: "0x0000000000000000000000000000000000000000",
            commercializerCheckerData: "0x",
            commercialRevShare: licenseSettings.revShare,
            commercialRevCeiling: BigInt(0),
            derivativesAllowed: licenseSettings.derivativesAllowed,
            derivativesAttribution: licenseSettings.derivativesAttribution,
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
            commercialRevShare: licenseSettings.revShare,
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
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <input type="file" accept="image/*" onChange={handleFileUpload} className="w-full" />
        {selectedFile && (
          <div className="mt-2">
            <p className="text-sm text-gray-600">Selected: {selectedFile.name}</p>
            {isDetecting && (
              <div className="flex items-center space-x-2 mt-1">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-blue-600 font-medium">Detecting...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image Preview - Selebar field judul */}
      {imagePreview && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {/* Preview gambar dengan loading overlay */}
            <div className="relative">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full h-48 object-cover rounded-lg border border-gray-200"
              />
              {isDetecting && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm">Detecting AI...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div></div> {/* Empty div untuk spacing grid */}
        </div>
      )}

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
          
          {/* Commercial Use */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={licenseSettings.commercialUse}
              onChange={(e) => setLicenseSettings(prev => ({ ...prev, commercialUse: e.target.checked }))}
            />
            <span>Allow Commercial Use</span>
          </label>

          {/* Revenue Share - hanya muncul jika commercial use dicentang */}
          {licenseSettings.commercialUse && (
            <div className="ml-6 space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Commercial Revenue Share (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={licenseSettings.revShare}
                onChange={(e) => setLicenseSettings(prev => ({ 
                  ...prev, 
                  revShare: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                }))}
                className="w-full p-2 border rounded-lg text-sm"
                placeholder="0-100"
              />
              <p className="text-xs text-gray-500">
                Percentage of revenue you'll receive from commercial use
              </p>
            </div>
          )}

          {/* Derivatives Allowed */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={licenseSettings.derivativesAllowed}
              onChange={(e) => setLicenseSettings(prev => ({ ...prev, derivativesAllowed: e.target.checked }))}
            />
            <span>Allow Derivative Works</span>
          </label>

          {/* Derivatives Attribution - hanya muncul jika derivatives diizinkan */}
          {licenseSettings.derivativesAllowed && (
            <div className="ml-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={licenseSettings.derivativesAttribution}
                  onChange={(e) => setLicenseSettings(prev => ({ ...prev, derivativesAttribution: e.target.checked }))}
                />
                <span className="text-sm">Require Attribution for Derivatives</span>
              </label>
            </div>
          )}

          {/* Attribution Required */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={licenseSettings.attribution}
              onChange={(e) => setLicenseSettings(prev => ({ ...prev, attribution: e.target.checked }))}
            />
            <span>Require Attribution</span>
          </label>

          {/* Transferable */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={licenseSettings.transferable}
              onChange={(e) => setLicenseSettings(prev => ({ ...prev, transferable: e.target.checked }))}
            />
            <span>License Transferable</span>
          </label>

          {/* AI Learning */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={licenseSettings.aiLearning}
              onChange={(e) => setLicenseSettings(prev => ({ ...prev, aiLearning: e.target.checked }))}
              disabled={aiDetection?.isAI}
            />
            <span>Allow AI Learning {aiDetection?.isAI && '(Disabled - AI Detected)'}</span>
          </label>

          {/* Expiration */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              License Expiration
            </label>
            <select
              value={licenseSettings.expiration}
              onChange={(e) => setLicenseSettings(prev => ({ ...prev, expiration: e.target.value }))}
              className="w-full p-2 border rounded-lg text-sm"
            >
              <option value="never">Never Expires</option>
              <option value="1year">1 Year</option>
              <option value="2years">2 Years</option>
              <option value="5years">5 Years</option>
              <option value="10years">10 Years</option>
            </select>
          </div>

          {/* Territory */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Territory
            </label>
            <select
              value={licenseSettings.territory}
              onChange={(e) => setLicenseSettings(prev => ({ ...prev, territory: e.target.value }))}
              className="w-full p-2 border rounded-lg text-sm"
            >
              <option value="global">Global</option>
              <option value="us">United States</option>
              <option value="eu">European Union</option>
              <option value="asia">Asia Pacific</option>
              <option value="custom">Custom Territory</option>
            </select>
          </div>

          {/* Custom Territory Input */}
          {licenseSettings.territory === 'custom' && (
            <div className="ml-4">
              <input
                type="text"
                placeholder="Specify territories (e.g., US, UK, Canada)"
                value={licenseSettings.customTerritory}
                onChange={(e) => setLicenseSettings(prev => ({ ...prev, customTerritory: e.target.value }))}
                className="w-full p-2 border rounded-lg text-sm"
              />
            </div>
          )}
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
