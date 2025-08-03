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
    pilType: 'non_commercial_remix',
    commercialUse: false,
    revShare: 0,
    derivativesAllowed: true,
    derivativesAttribution: true,
    attribution: false,
    transferable: true,
    aiLearning: true,
    expiration: '0',
    territory: 'Global',
    licensePrice: 0,
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [isPreparingTx, setIsPreparingTx] = useState(false);
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
    setAiDetection(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

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
    setIsPreparingTx(true);

    try {
      console.log('Starting IP registration...');
      console.log('PIL Type:', licenseSettings.pilType);

      const arrayBuffer = await selectedFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const imageCid = await uploadToIPFS(buffer, selectedFile.name);
      const imageUrl = `https://ipfs.io/ipfs/${imageCid}`;

      // Create metadata
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
          { trait_type: "License Type", value: licenseSettings.pilType },
          { trait_type: "AI Learning Allowed", value: licenseSettings.aiLearning ? "Yes" : "No" },
          { trait_type: "Commercial Use", value: licenseSettings.commercialUse ? "Yes" : "No" },
          ...(licenseSettings.commercialUse ? [{ trait_type: "Revenue Share", value: `${licenseSettings.revShare}%` }] : []),
          { trait_type: "Territory", value: licenseSettings.territory },
        ],
      };

      const ipMetadataCid = await uploadToIPFS(JSON.stringify(ipMetadata), 'metadata.json');
      const nftMetadataCid = await uploadToIPFS(JSON.stringify(nftMetadata), 'nft-metadata.json');

      setIsPreparingTx(false);
      console.log('Ready to sign transaction...');

      let response;

      // License logic berdasarkan pilihan
      if (licenseSettings.pilType === 'open_use') {
        // Open Use - Public Domain equivalent (no commercial restrictions)
        response = await storyClient.ipAsset.mintAndRegisterIpAssetWithPilTerms({
          spgNftContract: "0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc",
          licenseTermsData: [{
            terms: {
              transferable: true,
              royaltyPolicy: "0x0000000000000000000000000000000000000000",
              defaultMintingFee: BigInt(0),
              expiration: BigInt(0),
              commercialUse: false,
              commercialAttribution: false,
              commercializerChecker: "0x0000000000000000000000000000000000000000",
              commercializerCheckerData: "0x",
              commercialRevShare: 0,
              commercialRevCeiling: BigInt(0),
              derivativesAllowed: true,
              derivativesAttribution: false,
              derivativesApproval: false,
              derivativesReciprocal: false,
              derivativeRevCeiling: BigInt(0),
              currency: "0x0000000000000000000000000000000000000000",
              uri: "",
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
      } else if (licenseSettings.pilType === 'non_commercial_remix') {
        // Non-commercial remix
        response = await storyClient.ipAsset.mintAndRegisterIpAssetWithPilTerms({
          spgNftContract: "0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc",
          licenseTermsData: [{
            terms: {
              transferable: true,
              royaltyPolicy: "0x0000000000000000000000000000000000000000",
              defaultMintingFee: BigInt(0),
              expiration: BigInt(0),
              commercialUse: false,
              commercialAttribution: false,
              commercializerChecker: "0x0000000000000000000000000000000000000000",
              commercializerCheckerData: "0x",
              commercialRevShare: 0,
              commercialRevCeiling: BigInt(0),
              derivativesAllowed: true,
              derivativesAttribution: true,
              derivativesApproval: false,
              derivativesReciprocal: true,
              derivativeRevCeiling: BigInt(0),
              currency: "0x0000000000000000000000000000000000000000",
              uri: "",
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
      } else if (licenseSettings.pilType === 'commercial_use') {
        // Commercial use
        response = await storyClient.ipAsset.mintAndRegisterIpAssetWithPilTerms({
          spgNftContract: "0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc",
          licenseTermsData: [{
            terms: {
              transferable: true,
              royaltyPolicy: "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E",
              defaultMintingFee: BigInt(licenseSettings.licensePrice),
              expiration: BigInt(0),
              commercialUse: true,
              commercialAttribution: true,
              commercializerChecker: "0x0000000000000000000000000000000000000000",
              commercializerCheckerData: "0x",
              commercialRevShare: 0,
              commercialRevCeiling: BigInt(0),
              derivativesAllowed: false,
              derivativesAttribution: false,
              derivativesApproval: false,
              derivativesReciprocal: false,
              derivativeRevCeiling: BigInt(0),
              currency: "0x1514000000000000000000000000000000000000",
              uri: "",
            },
            licensingConfig: {
              isSet: false,
              mintingFee: BigInt(licenseSettings.licensePrice),
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
      } else if (licenseSettings.pilType === 'commercial_remix') {
        // Commercial remix
        response = await storyClient.ipAsset.mintAndRegisterIpAssetWithPilTerms({
          spgNftContract: "0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc",
          licenseTermsData: [{
            terms: {
              transferable: true,
              royaltyPolicy: "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E",
              defaultMintingFee: BigInt(licenseSettings.licensePrice),
              expiration: BigInt(0),
              commercialUse: true,
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
              uri: "",
            },
            licensingConfig: {
              isSet: false,
              mintingFee: BigInt(licenseSettings.licensePrice),
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
      }

      setResult(response);

    } catch (error) {
      console.error('Registration failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Registration failed: ${errorMessage}`);
    } finally {
      setIsRegistering(false);
      setIsPreparingTx(false);
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

      {imagePreview && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="relative">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-[230px] h-[230px] object-cover rounded-lg border border-gray-200"
                style={{ width: '230px', height: '230px' }}
              />
              {isDetecting && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center w-[230px] h-[230px]">
                  <div className="text-center text-white">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div></div>
        </div>
      )}

      {aiDetection && (
        <div className={`p-4 rounded-lg ${aiDetection.isAI ? 'bg-red-100' : 'bg-green-100'}`}>
          <h3 className="font-semibold">Detection Result:</h3>
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
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              License Type
            </label>
            <select
              value={licenseSettings.pilType}
              onChange={(e) => setLicenseSettings(prev => ({ 
                ...prev, 
                pilType: e.target.value,
                ...(e.target.value === 'open_use' && {
                  commercialUse: true,
                  derivativesAllowed: true,
                  attribution: false,
                  revShare: 0,
                  licensePrice: 0
                }),
                ...(e.target.value === 'non_commercial_remix' && {
                  commercialUse: false,
                  derivativesAllowed: true,
                  attribution: false,
                  revShare: 0,
                  licensePrice: 0
                }),
                ...(e.target.value === 'commercial_use' && {
                  commercialUse: true,
                  derivativesAllowed: false,
                  attribution: false,
                  revShare: 0
                }),
                ...(e.target.value === 'commercial_remix' && {
                  commercialUse: true,
                  derivativesAllowed: true,
                  attribution: false
                })
              }))}
              className="w-full p-2 border rounded-lg text-sm"
            >
              <option value="open_use">1. Open Use</option>
              <option value="non_commercial_remix">2. Non-Commercial Remix</option>
              <option value="commercial_use">3. Commercial Use</option>
              <option value="commercial_remix">4. Commercial Remix</option>
            </select>
            
            <div className="text-xs text-gray-600 p-3 bg-gray-50 rounded">
              {licenseSettings.pilType === 'open_use' && (
                <div>
                  <ul className="mt-1 text-xs">
                    <li>• Attribution not required</li>
                    <li>• Commercial use allowed</li>
                    <li>• Remixing allowed</li>
                    <li>• No royalty sharing</li>
                    <li>• AI training allowed</li>
                  </ul>
                </div>
              )}
              {licenseSettings.pilType === 'non_commercial_remix' && (
                <div>
                  <ul className="mt-1 text-xs">
                    <li>• Attribution not required</li>
                    <li>• Non-commercial use only</li>
                    <li>• Remixing allowed</li>
                    <li>• No royalty sharing</li>
                    <li>• AI training allowed</li>
                  </ul>
                </div>
              )}
              {licenseSettings.pilType === 'commercial_use' && (
                <div>
                  <ul className="mt-1 text-xs">
                    <li>• Attribution not required</li>
                    <li>• Commercial use allowed</li>
                    <li>• Remixing not allowed</li>
                    <li>• No royalty sharing</li>
                    <li>• AI training allowed</li>
                  </ul>
                </div>
              )}
              {licenseSettings.pilType === 'commercial_remix' && (
                <div>
                  <ul className="mt-1 text-xs">
                    <li>• Attribution not required</li>
                    <li>• Commercial use allowed</li>
                    <li>• Remixing allowed</li>
                    <li>• Royalty sharing</li>
                    <li>• AI training allowed</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {(licenseSettings.pilType === 'commercial_use' || licenseSettings.pilType === 'commercial_remix') && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                License Price (in $IP)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={licenseSettings.licensePrice}
                onChange={(e) => setLicenseSettings(prev => ({ 
                  ...prev, 
                  licensePrice: parseFloat(e.target.value) || 0
                }))}
                className="w-full p-2 border rounded-lg text-sm"
                placeholder="Enter license price in $IP"
              />
            </div>
          )}

          {licenseSettings.pilType === 'commercial_remix' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Revenue Share (%)
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
                placeholder="Enter revenue share percentage"
              />
            </div>
          )}

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={licenseSettings.aiLearning}
              onChange={(e) => setLicenseSettings(prev => ({ ...prev, aiLearning: e.target.checked }))}
              disabled={aiDetection?.isAI}
            />
            <span>Allow AI Training {aiDetection?.isAI && '(Disabled - AI Detected)'}</span>
          </label>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Territory
            </label>
            <select
              value={licenseSettings.territory}
              onChange={(e) => setLicenseSettings(prev => ({ ...prev, territory: e.target.value }))}
              className="w-full p-2 border rounded-lg text-sm"
            >
              <option value="Global">Global</option>
              <option value="US">United States</option>
              <option value="EU">European Union</option>
              <option value="Asia">Asia Pacific</option>
            </select>
          </div>
        </div>
      </div>

      <button
        onClick={registerIP}
        disabled={!selectedFile || !title || isRegistering || isDetecting}
        className="w-full bg-blue-500 text-white p-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600"
      >
        {isPreparingTx ? 'Preparing transaction...' : 
         isRegistering ? 'Waiting for signature...' : 
         'Register IP Asset'}
      </button>

      {result && (
        <div className="p-4 bg-green-100 rounded-lg">
          <h3 className="font-semibold text-green-800">Success!</h3>
          <p className="text-sm">IP Asset registered successfully!</p>
          
          <div className="mt-2">
            <span className="text-xs text-gray-600">Transaction: </span>
            <a 
              href={`https://aeneid.storyscan.io/tx/${result.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 underline break-all"
            >
              {result.txHash}
            </a>
          </div>
          
          <div className="mt-1">
            <span className="text-xs text-gray-600">IP ID: </span>
            <a 
              href={`https://aeneid.explorer.story.foundation/ipa/${result.ipId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 underline break-all"
            >
              {result.ipId}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
