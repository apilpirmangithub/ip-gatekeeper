"use client";
import { useState, useEffect } from 'react';
import { useWalletClient, useAccount } from 'wagmi';
import { custom } from 'viem';
import { createHash } from 'crypto';
import { StoryClient, StoryConfig } from '@story-protocol/core-sdk';
import { uploadToIPFS, detectAI } from '../services';
import { Shield, Upload, Brain, FileText, Settings, CheckCircle, AlertTriangle, Loader2, ExternalLink, Copy, Download } from 'lucide-react';

export default function IPGatekeeper() {
  const { data: wallet } = useWalletClient();
  const { address, isConnected } = useAccount();
  const [storyClient, setStoryClient] = useState<StoryClient | null>(null);
  
  // Multi-step state
  const [currentStep, setCurrentStep] = useState(1);
  const [hasAutoSlided, setHasAutoSlided] = useState(false);
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

  // Auto-slide after file selection
  useEffect(() => {
    if (currentStep === 1 && selectedFile && !hasAutoSlided) {
      const timer = setTimeout(() => {
        setCurrentStep(2);
        setHasAutoSlided(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, selectedFile, hasAutoSlided]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setAiDetection(null);
    setHasAutoSlided(false);
    
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

  const canProceedFromStep2 = () => aiDetection !== null;
  const canProceedFromStep3 = () => title.trim() !== '' && description.trim() !== '';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!isConnected) {
    return (
      <div className="text-center p-16 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-3xl border border-slate-700/50 backdrop-blur-sm">
        <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
          <Shield className="w-12 h-12 text-white" />
        </div>
        <h3 className="text-3xl font-bold text-white mb-4">Connect Your Wallet</h3>
        <p className="text-gray-400 text-lg max-w-md mx-auto">
          Connect your wallet to start protecting and registering your intellectual property assets
        </p>
      </div>
    );
  }

  const stepIcons = [Upload, Brain, FileText, Settings];
  const stepTitles = ["Upload Asset", "AI Analysis", "Asset Details", "License & Register"];
  const stepDescriptions = [
    "Select your creative asset for protection",
    "Advanced AI detection and analysis",
    "Provide asset information and metadata",
    "Configure licensing and complete registration"
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Progress Header */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4].map((step, index) => {
            const Icon = stepIcons[index];
            const isActive = step === currentStep;
            const isCompleted = step < currentStep;
            
            return (
              <div key={step} className="flex items-center">
                <div className={`relative flex items-center justify-center w-16 h-16 rounded-2xl border-2 transition-all duration-300 ${
                  isActive 
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 border-purple-400 shadow-lg shadow-purple-500/25' 
                    : isCompleted
                    ? 'bg-gradient-to-br from-green-500 to-emerald-500 border-green-400'
                    : 'bg-slate-800 border-slate-600'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-8 h-8 text-white" />
                  ) : (
                    <Icon className={`w-8 h-8 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  )}
                  {isActive && (
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-75 animate-pulse"></div>
                  )}
                </div>
                {index < 3 && (
                  <div className={`w-24 h-1 mx-4 rounded-full transition-all duration-300 ${
                    step < currentStep ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-slate-700'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
        
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-2">{stepTitles[currentStep - 1]}</h2>
          <p className="text-gray-400 text-lg">{stepDescriptions[currentStep - 1]}</p>
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden">
        <div className="p-8 min-h-[600px]">
          
          {/* Step 1: Upload Asset */}
          {currentStep === 1 && (
            <div className="space-y-8">
              <div className="relative group">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 ${
                  selectedFile 
                    ? 'border-green-400 bg-green-500/10' 
                    : 'border-slate-600 bg-slate-700/30 hover:border-purple-400 hover:bg-purple-500/10'
                }`}>
                  <div className="flex flex-col items-center space-y-4">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                      selectedFile 
                        ? 'bg-green-500 text-white' 
                        : 'bg-slate-700 text-gray-400 group-hover:bg-purple-500 group-hover:text-white'
                    }`}>
                      {selectedFile ? <CheckCircle className="w-10 h-10" /> : <Upload className="w-10 h-10" />}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {selectedFile ? 'File Selected!' : 'Drop your file here'}
                      </h3>
                      <p className="text-gray-400">
                        {selectedFile ? selectedFile.name : 'or click to browse • PNG, JPG, GIF up to 10MB'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {imagePreview && (
                <div className="flex justify-center">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                    <div className="relative bg-slate-900 p-4 rounded-2xl">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-80 h-80 object-cover rounded-xl shadow-2xl"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedFile && !hasAutoSlided && (
                <div className="text-center p-6 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                  <div className="flex items-center justify-center space-x-3 mb-3">
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                    <span className="text-blue-400 font-semibold">Preparing AI analysis...</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-progress"></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: AI Analysis */}
          {currentStep === 2 && (
            <div className="space-y-8">
              {imagePreview && (
                <div className="flex justify-center">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-75"></div>
                    <div className="relative bg-slate-900 p-4 rounded-2xl">
                      <img 
                        src={imagePreview} 
                        alt="Analysis" 
                        className="w-64 h-64 object-cover rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}

              {isDetecting && (
                <div className="text-center p-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl border border-blue-500/30">
                  <div className="w-20 h-20 mx-auto mb-6 relative">
                    <div className="absolute inset-0 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-2 border-4 border-purple-400 border-b-transparent rounded-full animate-spin" style={{animationDirection: 'reverse'}}></div>
                    <Brain className="absolute inset-0 m-auto w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">AI Analysis in Progress</h3>
                  <p className="text-gray-300">Our advanced algorithms are analyzing your image...</p>
                </div>
              )}

              {aiDetection && (
                <div className={`p-8 rounded-3xl border-2 shadow-2xl ${
                  aiDetection.isAI 
                    ? 'bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/50' 
                    : 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/50'
                }`}>
                  <div className="text-center mb-6">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                      aiDetection.isAI ? 'bg-orange-500' : 'bg-green-500'
                    }`}>
                      {aiDetection.isAI ? (
                        <AlertTriangle className="w-8 h-8 text-white" />
                      ) : (
                        <CheckCircle className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">Analysis Complete</h3>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                      <h4 className="text-lg font-bold text-white mb-2">Detection Result</h4>
                      <p className="text-2xl font-bold mb-1">
                        <span className={aiDetection.isAI ? 'text-orange-300' : 'text-green-300'}>
                          {aiDetection.isAI ? 'AI-Generated' : 'Original Content'}
                        </span>
                      </p>
                      <p className="text-gray-300">Content classification</p>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                      <h4 className="text-lg font-bold text-white mb-2">Confidence Score</h4>
                      <p className="text-2xl font-bold mb-1">
                        <span className="text-blue-300">{(aiDetection.confidence * 100).toFixed(1)}%</span>
                      </p>
                      <p className="text-gray-300">Analysis confidence</p>
                    </div>
                  </div>

                  {aiDetection.isAI && (
                    <div className="mt-6 p-4 bg-orange-500/20 rounded-2xl border border-orange-500/30">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <h5 className="font-bold text-orange-300 mb-1">AI Content Detected</h5>
                          <p className="text-sm text-orange-200">
                            AI training will be automatically disabled for this asset to comply with best practices.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Asset Details */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-lg font-bold text-white mb-3">Asset Name *</label>
                  <input
                    type="text"
                    placeholder="Enter a descriptive name for your asset"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-4 bg-slate-700/50 border border-slate-600 rounded-2xl text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-200"
                  />
                </div>
                
                <div>
                  <label className="block text-lg font-bold text-white mb-3">Category</label>
                  <select className="w-full p-4 bg-slate-700/50 border border-slate-600 rounded-2xl text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-200">
                    <option>Digital Art</option>
                    <option>Photography</option>
                    <option>Illustration</option>
                    <option>Design</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-lg font-bold text-white mb-3">Description *</label>
                <textarea
                  placeholder="Provide a detailed description of your asset, its creation process, and intended use..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="w-full p-4 bg-slate-700/50 border border-slate-600 rounded-2xl text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-200 resize-none"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-slate-700/30 rounded-2xl p-6 border border-slate-600">
                  <h4 className="font-bold text-white mb-2">File Info</h4>
                  <div className="space-y-2 text-sm text-gray-300">
                    <p>Size: {selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}</p>
                    <p>Type: {selectedFile?.type || 'N/A'}</p>
                    <p>Format: {selectedFile?.name.split('.').pop()?.toUpperCase() || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="bg-slate-700/30 rounded-2xl p-6 border border-slate-600">
                  <h4 className="font-bold text-white mb-2">AI Analysis</h4>
                  <div className="space-y-2 text-sm text-gray-300">
                    <p>Status: {aiDetection ? (aiDetection.isAI ? 'AI-Generated' : 'Original') : 'Pending'}</p>
                    <p>Confidence: {aiDetection ? (aiDetection.confidence * 100).toFixed(1) + '%' : 'N/A'}</p>
                    <p>Verified: {aiDetection ? 'Yes' : 'No'}</p>
                  </div>
                </div>
                
                <div className="bg-slate-700/30 rounded-2xl p-6 border border-slate-600">
                  <h4 className="font-bold text-white mb-2">Protection</h4>
                  <div className="space-y-2 text-sm text-gray-300">
                    <p>Blockchain: Story Protocol</p>
                    <p>Network: Aeneid Testnet</p>
                    <p>Standard: ERC-721</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: License & Register */}
          {currentStep === 4 && (
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-3xl border border-purple-500/20 p-8">
                <h3 className="text-2xl font-bold text-white mb-6">License Configuration</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-lg font-bold text-white mb-3">License Type</label>
                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        { value: 'open_use', label: 'Open Use', desc: 'Free for non-commercial use' },
                        { value: 'non_commercial_remix', label: 'Non-Commercial Remix', desc: 'Allow remixing, no commercial use' },
                        { value: 'commercial_use', label: 'Commercial Use', desc: 'Allow commercial use, no derivatives' },
                        { value: 'commercial_remix', label: 'Commercial Remix', desc: 'Full commercial rights with revenue sharing' }
                      ].map((option) => (
                        <div
                          key={option.value}
                          onClick={() => setLicenseSettings(prev => ({ 
                            ...prev, 
                            pilType: option.value,
                            ...(option.value === 'open_use' && {
                              commercialUse: false,
                              derivativesAllowed: true,
                              attribution: false,
                              revShare: 0,
                              licensePrice: 0
                            }),
                            ...(option.value === 'non_commercial_remix' && {
                              commercialUse: false,
                              derivativesAllowed: true,
                              attribution: false,
                              revShare: 0,
                              licensePrice: 0
                            }),
                            ...(option.value === 'commercial_use' && {
                              commercialUse: true,
                              derivativesAllowed: false,
                              attribution: false,
                              revShare: 0
                            }),
                            ...(option.value === 'commercial_remix' && {
                              commercialUse: true,
                              derivativesAllowed: true,
                              attribution: false
                            })
                          }))}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                            licenseSettings.pilType === option.value
                              ? 'border-purple-400 bg-purple-500/20'
                              : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                          }`}
                        >
                          <h4 className="font-bold text-white mb-1">{option.label}</h4>
                          <p className="text-sm text-gray-400">{option.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {(licenseSettings.pilType === 'commercial_use' || licenseSettings.pilType === 'commercial_remix') && (
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-lg font-bold text-white mb-3">License Price ($IP)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={licenseSettings.licensePrice}
                          onChange={(e) => setLicenseSettings(prev => ({ 
                            ...prev, 
                            licensePrice: parseFloat(e.target.value) || 0
                          }))}
                          className="w-full p-4 bg-slate-700/50 border border-slate-600 rounded-2xl text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-200"
                          placeholder="0.00"
                        />
                      </div>
                      
                      {licenseSettings.pilType === 'commercial_remix' && (
                        <div>
                          <label className="block text-lg font-bold text-white mb-3">Revenue Share (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={licenseSettings.revShare}
                            onChange={(e) => setLicenseSettings(prev => ({ 
                              ...prev, 
                              revShare: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                            }))}
                            className="w-full p-4 bg-slate-700/50 border border-slate-600 rounded-2xl text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-200"
                            placeholder="0"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-2xl border border-slate-600">
                    <div className="flex items-center space-x-3">
                      <Brain className="w-5 h-5 text-purple-400" />
                      <div>
                        <h4 className="font-bold text-white">AI Training Permission</h4>
                        <p className="text-sm text-gray-400">Allow AI models to learn from this content</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={licenseSettings.aiLearning}
                        onChange={(e) => setLicenseSettings(prev => ({ ...prev, aiLearning: e.target.checked }))}
                        disabled={aiDetection?.isAI}
                        className="sr-only peer"
                      />
                      <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                        aiDetection?.isAI 
                          ? 'bg-gray-600 cursor-not-allowed' 
                          : licenseSettings.aiLearning 
                          ? 'bg-purple-600' 
                          : 'bg-gray-700'
                      } peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300/20`}>
                        <div className={`absolute top-[2px] left-[2px] bg-white rounded-full h-5 w-5 transition-transform duration-200 ${
                          licenseSettings.aiLearning && !aiDetection?.isAI ? 'translate-x-5' : 'translate-x-0'
                        }`}></div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Registration Button */}
              <button
                onClick={registerIP}
                disabled={isRegistering || isDetecting}
                className={`w-full p-6 rounded-3xl text-xl font-bold transition-all duration-300 ${
                  isRegistering || isDetecting
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 shadow-lg hover:shadow-2xl hover:scale-[1.02] transform'
                }`}
              >
                <div className="flex items-center justify-center space-x-3">
                  {isPreparingTx ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Preparing Transaction...</span>
                    </>
                  ) : isRegistering ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Awaiting Signature...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-6 h-6" />
                      <span>Register IP Asset</span>
                    </>
                  )}
                </div>
              </button>

              {/* Success Result */}
              {result && (
                <div className="p-8 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-3xl border border-green-500/30 shadow-2xl">
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">Registration Successful!</h3>
                    <p className="text-green-200 text-lg">Your IP asset has been successfully registered on Story Protocol</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-white">Transaction Hash</h4>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => copyToClipboard(result.txHash)}
                            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors"
                          >
                            <Copy className="w-4 h-4 text-blue-400" />
                          </button>
                          <a
                            href={`https://aeneid.storyscan.io/tx/${result.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-4 h-4 text-blue-400" />
                          </a>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 font-mono bg-slate-800/50 p-3 rounded-lg break-all">
                        {result.txHash}
                      </p>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-white">IP Asset ID</h4>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => copyToClipboard(result.ipId)}
                            className="p-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition-colors"
                          >
                            <Copy className="w-4 h-4 text-purple-400" />
                          </button>
                          <a
                            href={`https://aeneid.explorer.story.foundation/ipa/${result.ipId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-4 h-4 text-purple-400" />
                          </a>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 font-mono bg-slate-800/50 p-3 rounded-lg break-all">
                        {result.ipId}
                      </p>
                    </div>
                  </div>

                  <div className="text-center mt-8">
                    <button
                      onClick={() => {
                        setCurrentStep(1);
                        setSelectedFile(null);
                        setImagePreview(null);
                        setAiDetection(null);
                        setTitle('');
                        setDescription('');
                        setResult(null);
                        setHasAutoSlided(false);
                      }}
                      className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl transition-all duration-300 hover:scale-105 transform shadow-lg"
                    >
                      Register Another Asset
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="flex justify-between items-center p-6 bg-slate-800/30 border-t border-slate-700/50">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 ${
              currentStep === 1
                ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                : 'bg-slate-700 text-white hover:bg-slate-600 hover:scale-105 transform'
            }`}
          >
            <span>← Previous</span>
          </button>

          <div className="text-sm text-gray-400">
            Step {currentStep} of {totalSteps}
          </div>

          {currentStep < 4 && (
            <button
              onClick={nextStep}
              disabled={
                (currentStep === 2 && !canProceedFromStep2()) ||
                (currentStep === 3 && !canProceedFromStep3())
              }
              className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 ${
                (currentStep === 2 && !canProceedFromStep2()) ||
                (currentStep === 3 && !canProceedFromStep3())
                  ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 hover:scale-105 transform'
              }`}
            >
              <span>Next →</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}