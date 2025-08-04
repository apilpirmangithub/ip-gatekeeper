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
  
  // Multi-step state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  
  // Form data states
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

  // Auto-slide setelah file dipilih
  useEffect(() => {
    if (currentStep === 1 && selectedFile) {
      const timer = setTimeout(() => {
        setCurrentStep(2);
      }, 1000); // Auto slide setelah 1 detik
      return () => clearTimeout(timer);
    }
  }, [currentStep, selectedFile]);

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

      if (licenseSettings.pilType === 'open_use') {
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

  // Navigation functions
  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Validation functions
  const canProceedFromStep2 = () => aiDetection !== null;
  const canProceedFromStep3 = () => title.trim() !== '' && description.trim() !== '';

  if (!isConnected) {
    return (
      <div className="text-center p-12 bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200 rounded-3xl border-4 border-purple-400 shadow-xl">
        <div className="text-8xl mb-6">🔗</div>
        <p className="text-2xl text-purple-800 font-bold">Please connect your wallet to continue.</p>
        <div className="mt-4 w-32 h-2 bg-purple-400 rounded-full mx-auto animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          {currentStep === 1 && "Choose File"}
          {currentStep === 2 && "AI Detection"}
          {currentStep === 3 && "Asset Information"}
          {currentStep === 4 && "License & Register"}
        </h2>
        <p className="text-gray-600">
          {currentStep === 1 && "Select an image file to upload"}
          {currentStep === 2 && "AI detection in progress and results"}
          {currentStep === 3 && "Enter asset name and description"}
          {currentStep === 4 && "Configure license and register your IP Asset"}
        </p>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 min-h-[500px]">
        {/* Step 1: Choose File */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">📁</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Upload Your Asset</h3>
              <p className="text-gray-600">Choose an image file to register as an IP Asset</p>
            </div>

            <div className="border-4 border-dashed border-orange-400 rounded-3xl p-8 bg-gradient-to-br from-orange-100 via-yellow-100 to-pink-100 shadow-lg">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload} 
                className="w-full p-4 bg-white rounded-2xl border-2 border-orange-300 text-orange-800 font-semibold cursor-pointer"
              />
              {selectedFile && (
                <div className="mt-4 p-4 bg-white rounded-2xl border-2 border-orange-300">
                  <p className="text-sm text-orange-700 font-semibold">
                    🎯 Selected: {selectedFile.name}
                  </p>
                  <div className="mt-2 text-center">
                    <p className="text-sm text-blue-600">Auto-advancing to detection...</p>
                    <div className="w-full bg-gray-300 rounded-full h-2 mt-2">
                      <div className="bg-blue-500 h-2 rounded-full animate-progress" style={{width: '100%'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-2xl shadow-2xl">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-[230px] h-[230px] object-cover rounded-xl border-4 border-gray-200 shadow-lg"
                    style={{ width: '230px', height: '230px' }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: AI Detection (Detecting + Results dalam satu tampilan) */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">AI Detection</h3>
              <p className="text-gray-600">Analysis of your uploaded image</p>
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="flex justify-center mb-6">
                <div className="bg-white p-4 rounded-2xl shadow-2xl">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-[230px] h-[230px] object-cover rounded-xl border-4 border-gray-200 shadow-lg"
                    style={{ width: '230px', height: '230px' }}
                  />
                </div>
              </div>
            )}

            {/* Detection Process */}
            {isDetecting && (
              <div className="text-center p-8 bg-blue-50 rounded-3xl border-2 border-blue-200">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-lg text-blue-600 font-bold">🔍 Analyzing your image...</p>
                <p className="text-sm text-blue-500 mt-2">This may take a few seconds</p>
              </div>
            )}

            {/* AI Detection Result */}
            {aiDetection && (
              <div className={`p-6 rounded-3xl border-4 shadow-xl animate-slideUp ${
                aiDetection.isAI 
                  ? 'bg-gradient-to-br from-red-200 via-pink-200 to-orange-200 border-red-400' 
                  : 'bg-gradient-to-br from-green-200 via-emerald-200 to-blue-200 border-green-400'
              }`}>
                <div className="text-4xl mb-4 text-center">
                  {aiDetection.isAI ? '🤖' : '🎨'}
                </div>
                <h3 className="font-bold text-2xl mb-3 text-center">
                  {aiDetection.isAI ? '🔴' : '🟢'} Detection Complete!
                </h3>
                <div className="text-center space-y-2">
                  <p className="text-lg font-semibold">
                    🏷️ Status: <span className="font-bold">{aiDetection.isAI ? 'AI-Generated' : 'Original'}</span>
                  </p>
                  <p className="text-lg font-semibold">
                    📊 Confidence: <span className="font-bold">{(aiDetection.confidence * 100).toFixed(1)}%</span>
                  </p>
                  {aiDetection.isAI && (
                    <div className="mt-4 p-3 bg-white bg-opacity-50 rounded-lg">
                      <p className="text-sm font-semibold text-red-700">
                        ⚠️ AI-generated content detected. AI training will be automatically disabled.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Loading state when no detection yet */}
            {!isDetecting && !aiDetection && (
              <div className="text-center p-8">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-lg text-gray-600">Preparing AI detection...</p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Asset Information */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Asset Information</h3>
              <p className="text-gray-600">Provide details about your IP Asset</p>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-6 rounded-3xl border-4 border-blue-300 shadow-xl">
                <div className="text-3xl mb-4 text-center">📝</div>
                <label className="block text-lg font-bold text-blue-800 mb-2">Asset Name</label>
                <input
                  type="text"
                  placeholder="✨ Enter asset name..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-4 border-2 border-blue-300 rounded-2xl text-lg font-semibold text-blue-800 bg-white shadow-lg"
                />
              </div>
              
              <div className="bg-gradient-to-br from-green-100 via-teal-100 to-blue-100 p-6 rounded-3xl border-4 border-green-300 shadow-xl">
                <div className="text-3xl mb-4 text-center">📖</div>
                <label className="block text-lg font-bold text-green-800 mb-2">Description</label>
                <textarea
                  placeholder="🎯 Describe your masterpiece..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-4 border-2 border-green-300 rounded-2xl h-32 text-lg font-semibold text-green-800 bg-white shadow-lg resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: License & Register */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">⚖️</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">License Settings</h3>
              <p className="text-gray-600">Configure how others can use your IP Asset</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-100 via-orange-100 to-red-100 p-6 rounded-3xl border-4 border-yellow-400 shadow-xl">
              <div className="space-y-4">
                <label className="block text-lg font-bold text-yellow-800">
                  🏷️ License Type
                </label>
                <select
                  value={licenseSettings.pilType}
                  onChange={(e) => setLicenseSettings(prev => ({ 
                    ...prev, 
                    pilType: e.target.value,
                    ...(e.target.value === 'open_use' && {
                      commercialUse: false,
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
                  className="w-full p-4 border-2 border-yellow-400 rounded-2xl text-lg font-bold text-yellow-800 bg-white shadow-lg"
                >
                  <option value="open_use">🔓 1. Open Use</option>
                  <option value="non_commercial_remix">🎨 2. Non-Commercial Remix</option>
                  <option value="commercial_use">💼 3. Commercial Use</option>
                  <option value="commercial_remix">🔄 4. Commercial Remix</option>
                </select>
                
                <div className="text-sm p-4 bg-white rounded-2xl border-2 border-yellow-300">
                  {licenseSettings.pilType === 'open_use' && (
                    <div className="text-yellow-700">
                      <div className="text-lg font-bold mb-2">🔓 Open Freedom!</div>
                      <ul className="space-y-1 text-sm font-semibold">
                        <li>🚫 Attribution not required</li>
                        <li>🎨 Non-commercial use only</li> 
                        <li>🔄 Remixing allowed</li>
                        <li>💰 No royalty sharing</li>
                        <li>🤖 AI training allowed</li>
                     </ul>
                   </div>
                 )}
                  {licenseSettings.pilType === 'non_commercial_remix' && (
                    <div className="text-yellow-700">
                      <div className="text-lg font-bold mb-2">🎨 Creative Commons Style!</div>
                      <ul className="space-y-1 text-sm font-semibold">
                        <li>🚫 Attribution not required</li>
                        <li>🎨 Non-commercial use only</li>
                        <li>🔄 Remixing allowed</li>
                        <li>💰 No royalty sharing</li>
                        <li>🤖 AI training allowed</li>
                      </ul>
                    </div>
                  )}
                  {licenseSettings.pilType === 'commercial_use' && (
                    <div className="text-yellow-700">
                      <div className="text-lg font-bold mb-2">💼 Business Ready!</div>
                      <ul className="space-y-1 text-sm font-semibold">
                        <li>🚫 Attribution not required</li>
                        <li>💼 Commercial use allowed</li>
                        <li>🚫 Remixing not allowed</li>
                        <li>💰 No royalty sharing</li>
                        <li>🤖 AI training allowed</li>
                      </ul>
                    </div>
                  )}
                  {licenseSettings.pilType === 'commercial_remix' && (
                    <div className="text-yellow-700">
                      <div className="text-lg font-bold mb-2">🔄 Ultimate Flexibility!</div>
                      <ul className="space-y-1 text-sm font-semibold">
                        <li>🚫 Attribution not required</li>
                        <li>💼 Commercial use allowed</li>
                        <li>🔄 Remixing allowed</li>
                        <li>💰 Royalty sharing</li>
                        <li>🤖 AI training allowed</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {(licenseSettings.pilType === 'commercial_use' || licenseSettings.pilType === 'commercial_remix') && (
                <div className="space-y-4 mt-6">
                  <label className="block text-lg font-bold text-orange-800">
                    💎 License Price (in $IP)
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
                    className="w-full p-4 border-2 border-orange-400 rounded-2xl text-lg font-bold text-orange-800 bg-white shadow-lg"
                    placeholder="💰 Enter license price in $IP"
                  />
                </div>
              )}

              {licenseSettings.pilType === 'commercial_remix' && (
                <div className="space-y-4 mt-6">
                  <label className="block text-lg font-bold text-red-800">
                    📊 Revenue Share (%)
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
                    className="w-full p-4 border-2 border-red-400 rounded-2xl text-lg font-bold text-red-800 bg-white shadow-lg"
                    placeholder="📈 Enter revenue share percentage"
                  />
                </div>
              )}

              <div className="mt-6 p-4 bg-white rounded-2xl border-2 border-purple-300 shadow-lg">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={licenseSettings.aiLearning}
                    onChange={(e) => setLicenseSettings(prev => ({ ...prev, aiLearning: e.target.checked }))}
                    disabled={aiDetection?.isAI}
                    className="w-5 h-5 text-purple-600"
                  />
                  <span className={`text-lg font-bold ${aiDetection?.isAI ? 'text-gray-500' : 'text-purple-800'}`}>
                    🤖 Allow AI Training {aiDetection?.isAI && '(Disabled - AI Detected)'}
                  </span>
                </label>
              </div>

              <div className="space-y-4 mt-6">
                <label className="block text-lg font-bold text-indigo-800">
                  🌍 Territory
                </label>
                <select
                  value={licenseSettings.territory}
                  onChange={(e) => setLicenseSettings(prev => ({ ...prev, territory: e.target.value }))}
                  className="w-full p-4 border-2 border-indigo-400 rounded-2xl text-lg font-bold text-indigo-800 bg-white shadow-lg"
                >
                  <option value="Global">🌎 Global</option>
                  <option value="US">🇺🇸 United States</option>
                  <option value="EU">🇪🇺 European Union</option>
                  <option value="Asia">🌏 Asia Pacific</option>
                </select>
              </div>
            </div>

            {/* Register Button */}
            <button
              onClick={registerIP}
              disabled={isRegistering || isDetecting}
              className={`w-full p-6 rounded-3xl text-2xl font-bold shadow-2xl border-4 transition-all duration-300 ${
                isRegistering || isDetecting
                  ? 'bg-gray-300 border-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 border-purple-400 text-white hover:from-purple-600 hover:via-pink-600 hover:to-blue-600'
              }`}
            >
              <div className="flex items-center justify-center space-x-3">
                {isPreparingTx ? (
                  <>
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>⚙️ Preparing transaction...</span>
                  </>
                ) : isRegistering ? (
                  <>
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>✋ Waiting for signature...</span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl">🚀</span>
                    <span>Register IP Asset</span>
                  </>
                )}
              </div>
            </button>

            {/* Success Result */}
            {result && (
              <div className="p-8 bg-gradient-to-br from-green-100 via-emerald-100 to-teal-100 rounded-3xl border-4 border-green-400 shadow-2xl">
                <div className="text-center mb-6">
                  <div className="text-8xl mb-4">🎉</div>
                  <h3 className="font-bold text-3xl text-green-800 mb-2">Success!</h3>
                  <p className="text-xl font-semibold text-green-700">IP Asset registered successfully!</p>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-2xl border-2 border-green-300">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-2xl">📋</span>
                      <span className="text-sm font-bold text-gray-600">Transaction:</span>
                    </div>
                    <a 
                      href={`https://aeneid.storyscan.io/tx/${result.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline break-all font-mono bg-blue-50 p-2 rounded-lg block hover:bg-blue-100"
                    >
                      {result.txHash}
                    </a>
                  </div>
                  
                  <div className="p-4 bg-white rounded-2xl border-2 border-green-300">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-2xl">🏷️</span>
                      <span className="text-sm font-bold text-gray-600">IP ID:</span>
                    </div>
                    <a 
                      href={`https://aeneid.explorer.story.foundation/ipa/${result.ipId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline break-all font-mono bg-blue-50 p-2 rounded-lg block hover:bg-blue-100"
                    >
                      {result.ipId}
                    </a>
                  </div>
                </div>

                <div className="text-center mt-6">
                  <button
                    onClick={() => {
                      setCurrentStep(1);
                      setSelectedFile(null);
                      setImagePreview(null);
                      setAiDetection(null);
                      setTitle('');
                      setDescription('');
                      setResult(null);
                    }}
                    className="px-8 py-4 rounded-2xl font-bold text-lg bg-green-500 text-white hover:bg-green-600 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Register Another Asset
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
            currentStep === 1
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gray-500 text-white hover:bg-gray-600 shadow-lg hover:shadow-xl'
          }`}
        >
          ← Back
        </button>

        {currentStep < 4 && (
          <button
            onClick={nextStep}
            disabled={
              (currentStep === 2 && !canProceedFromStep2()) ||
              (currentStep === 3 && !canProceedFromStep3())
            }
            className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
              (currentStep === 2 && !canProceedFromStep2()) ||
              (currentStep === 3 && !canProceedFromStep3())
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:shadow-xl'
            }`}
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}
