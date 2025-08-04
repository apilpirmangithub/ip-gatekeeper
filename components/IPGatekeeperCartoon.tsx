"use client";
import { useState, useEffect } from 'react';
import { useWalletClient, useAccount } from 'wagmi';
import { custom, parseEther } from 'viem';
import { createHash } from 'crypto';
import { StoryClient, StoryConfig } from '@story-protocol/core-sdk';
import { uploadToIPFS, detectAI } from '../services';
import { Loader2 } from 'lucide-react';

const styles = {
  container: {
    width: '100%',
    maxWidth: '900px',
    margin: '0 auto',
    padding: 'clamp(1rem, 4vw, 2rem)',
    minHeight: '100vh',
    boxSizing: 'border-box' as const,
  },
  card: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 'clamp(15px, 3vw, 30px)',
    padding: 'clamp(1.5rem, 4vw, 3rem)',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
    position: 'relative' as const,
    overflow: 'hidden',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  walletCard: {
    background: 'white',
    borderRadius: 'clamp(15px, 3vw, 30px)',
    padding: 'clamp(2rem, 5vw, 4rem) clamp(1rem, 3vw, 2rem)',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.1)',
    textAlign: 'center' as const,
  },
  walletIcon: {
    fontSize: 'clamp(50px, 8vw, 80px)',
    marginBottom: '1rem',
    display: 'block',
  },
  progressContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 'clamp(2rem, 4vw, 3rem)',
    position: 'relative' as const,
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
  },
  progressLine: {
    position: 'absolute' as const,
    top: 'clamp(20px, 4vw, 30px)',
    left: 'clamp(30px, 6vw, 60px)',
    right: 'clamp(30px, 6vw, 60px)',
    height: '4px',
    background: '#E5E7EB',
    borderRadius: '2px',
    display: 'none', // Hide on mobile
    '@media (min-width: 768px)': {
      display: 'block',
    },
  },
  progressLineActive: {
    position: 'absolute' as const,
    top: '0',
    left: '0',
    height: '100%',
    background: 'linear-gradient(90deg, #7C3AED, #EC4899)',
    transition: 'width 0.5s ease',
    borderRadius: '2px',
  },
  step: {
    position: 'relative' as const,
    zIndex: 2,
    textAlign: 'center' as const,
    flex: '1',
    minWidth: '60px',
  },
  stepCircle: {
    width: 'clamp(40px, 8vw, 60px)',
    height: 'clamp(40px, 8vw, 60px)',
    background: '#F3F4F6',
    borderRadius: '50%',
    margin: '0 auto 0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'clamp(16px, 3vw, 24px)',
    transition: 'all 0.3s ease',
    border: '4px solid white',
    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
  },
  stepCircleActive: {
    background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
    transform: 'scale(1.1)',
    boxShadow: '0 8px 25px rgba(124, 58, 237, 0.3)',
  },
  stepCircleCompleted: {
    background: '#10B981',
    color: 'white',
  },
  stepLabel: {
    fontSize: 'clamp(12px, 2.5vw, 14px)',
    color: '#6B7280',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: '#7C3AED',
    fontWeight: '600',
  },
  uploadArea: {
    border: '3px dashed #7C3AED',
    borderRadius: 'clamp(15px, 3vw, 25px)',
    padding: 'clamp(2rem, 6vw, 4rem) clamp(1rem, 3vw, 2rem)',
    textAlign: 'center' as const,
    background: 'linear-gradient(135deg, rgba(124,58,237,0.05), rgba(236,72,153,0.05))',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  },
  uploadAreaHover: {
    borderColor: '#EC4899',
    background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(236,72,153,0.1))',
    transform: 'scale(1.02)',
  },
  uploadIcon: {
    width: 'clamp(50px, 10vw, 80px)',
    height: 'clamp(50px, 10vw, 80px)',
    background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
    borderRadius: '50%',
    margin: '0 auto 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'clamp(24px, 5vw, 36px)',
  },
  previewImage: {
    maxWidth: '100%',
    width: 'clamp(200px, 50vw, 300px)',
    height: 'auto',
    borderRadius: '20px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
    margin: '2rem auto',
    display: 'block',
  },
  formGroup: {
    marginBottom: '1.5rem',
  },
  formLabel: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '600',
    color: '#1E293B',
    fontSize: 'clamp(14px, 2.5vw, 16px)',
  },
  formInput: {
    width: '100%',
    padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1rem, 2.5vw, 1.5rem)',
    border: '2px solid #E5E7EB',
    borderRadius: '15px',
    fontSize: 'clamp(14px, 2.5vw, 16px)',
    transition: 'all 0.3s ease',
    background: '#F9FAFB',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  },
  licenseGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 100%), 1fr))',
    gap: 'clamp(0.5rem, 2vw, 1rem)',
    marginBottom: '2rem',
  },
  licenseCard: {
    background: '#F9FAFB',
    border: '3px solid transparent',
    borderRadius: '20px',
    padding: 'clamp(1rem, 3vw, 1.5rem)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'center' as const,
  },
  licenseCardSelected: {
    borderColor: '#7C3AED',
    background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(236,72,153,0.1))',
  },
  licenseCardTitle: {
    fontWeight: 600,
    marginBottom: '0.5rem',
    color: '#1F2937',
    fontSize: 'clamp(14px, 2.5vw, 16px)',
  },
  licenseCardDesc: {
    fontSize: 'clamp(12px, 2vw, 14px)',
    color: '#4B5563',
  },
  customSettings: {
    background: '#F3F4F6',
    borderRadius: '15px',
    padding: 'clamp(1rem, 3vw, 1.5rem)',
    marginTop: '1rem',
  },
  settingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
  },
  settingInput: {
    width: 'clamp(80px, 20vw, 120px)',
    padding: '0.5rem',
    border: '2px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: 'clamp(12px, 2vw, 14px)',
  },
  toggleContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#F3F4F6',
    padding: 'clamp(1rem, 3vw, 1.5rem)',
    borderRadius: '15px',
    marginBottom: '1.5rem',
    flexWrap: 'wrap' as const,
    gap: '1rem',
  },
  toggleSwitch: {
    position: 'relative' as const,
    width: '60px',
    height: '30px',
    background: '#E5E7EB',
    borderRadius: '50px',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
    flexShrink: 0,
  },
  toggleSwitchActive: {
    background: '#7C3AED',
  },
  toggleKnob: {
    position: 'absolute' as const,
    width: '24px',
    height: '24px',
    background: 'white',
    borderRadius: '50%',
    top: '3px',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
  },
  button: {
    padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 3vw, 2rem)',
    border: 'none',
    borderRadius: '50px',
    fontSize: 'clamp(14px, 2.5vw, 16px)',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontFamily: 'inherit',
    justifyContent: 'center',
    minHeight: '48px', // Touch-friendly
  },
  buttonPrimary: {
    background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
    color: 'white',
    boxShadow: '0 5px 20px rgba(124, 58, 237, 0.3)',
  },
  buttonSecondary: {
    background: '#F3F4F6',
    color: '#1E293B',
    border: '2px solid #E5E7EB',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  successContainer: {
    textAlign: 'center' as const,
    padding: 'clamp(2rem, 5vw, 3rem)',
  },
  successIcon: {
    fontSize: 'clamp(50px, 10vw, 80px)',
    marginBottom: '1rem',
    display: 'block',
  },
  resultInfo: {
    background: '#F9FAFB',
    borderRadius: '20px',
    padding: 'clamp(1.5rem, 3vw, 2rem)',
    marginTop: '2rem',
    textAlign: 'left' as const,
  },
  resultItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 0',
    borderBottom: '1px solid #E5E7EB',
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid #F3F4F6',
    borderTopColor: '#7C3AED',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '2rem auto',
  },
  aiDetectionCard: {
    background: 'linear-gradient(135deg, #F3F4F6, #E5E7EB)',
    borderRadius: '20px',
    padding: 'clamp(1.5rem, 4vw, 2rem)',
    marginTop: '2rem',
    textAlign: 'center' as const,
  },
  aiBadge: {
    display: 'inline-block',
    background: '#F59E0B',
    color: 'white',
    padding: '0.5rem 1.5rem',
    borderRadius: '50px',
    fontSize: 'clamp(12px, 2vw, 14px)',
    fontWeight: '600',
    marginBottom: '1rem',
  },
  navigationButtons: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 'clamp(2rem, 4vw, 3rem)',
    paddingTop: '2rem',
    borderTop: '2px solid #E5E7EB',
    gap: '1rem',
    flexWrap: 'wrap' as const,
  },
  // Media queries untuk CSS-in-JS
  '@media (max-width: 768px)': {
    progressLine: {
      display: 'none',
    },
    licenseGrid: {
      gridTemplateColumns: '1fr',
    },
    settingRow: {
      flexDirection: 'column' as const,
      alignItems: 'flex-start',
    },
    toggleContainer: {
      flexDirection: 'column' as const,
      alignItems: 'flex-start',
    },
    navigationButtons: {
      flexDirection: 'column' as const,
    },
    resultItem: {
      flexDirection: 'column' as const,
      alignItems: 'flex-start',
    },
  },
};

export default function IPGatekeeperCartoon() {
  const { data: wallet } = useWalletClient();
  const { address, isConnected } = useAccount();
  const [storyClient, setStoryClient] = useState<StoryClient | null>(null);
  
  // Multi-step state
  const [currentStep, setCurrentStep] = useState(1);
  const [hasAutoSlided, setHasAutoSlided] = useState(false);
  
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
  const [isHovering, setIsHovering] = useState(false);

  // Initialize Story Client
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

  // Add CSS animation and responsive styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.8; }
      }
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
      .animate-pulse { animation: pulse 2s infinite; }
      .animate-bounce { animation: bounce 2s infinite; }
      
      /* Responsive adjustments */
      @media (max-width: 768px) {
        .progress-line { display: none !important; }
        .license-grid { grid-template-columns: 1fr !important; }
        .setting-row { flex-direction: column !important; align-items: flex-start !important; }
        .toggle-container { flex-direction: column !important; align-items: flex-start !important; }
        .navigation-buttons { flex-direction: column !important; }
        .result-item { flex-direction: column !important; align-items: flex-start !important; }
      }
      
      /* Ensure viewport meta tag behavior */
      html, body {
        overflow-x: hidden;
        width: 100%;
        margin: 0;
        padding: 0;
      }
      
      * {
        box-sizing: border-box;
      }
      
      /* Touch-friendly interactions */
      @media (hover: none) and (pointer: coarse) {
        button, .upload-area, .license-card, .toggle-switch {
          min-height: 44px;
          min-width: 44px;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Add viewport meta tag if not present
    if (!document.querySelector('meta[name="viewport"]')) {
      const viewport = document.createElement('meta');
      viewport.name = 'viewport';
      viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(viewport);
    }
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setAiDetection(null);
    setHasAutoSlided(false);
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Start AI analysis immediately
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
      // Fallback untuk demo
      setAiDetection({ isAI: false, confidence: 0.85 });
    } finally {
      setIsDetecting(false);
    }
  };

  // Get license terms function
  const getLicenseTerms = () => {
    const baseTerms = {
      transferable: true,
      defaultMintingFee: BigInt(0),
      expiration: BigInt(0),
      commercialRevCeiling: BigInt(0),
      derivativeRevCeiling: BigInt(0),
      uri: "",
      commercialUse: false,
      commercialAttribution: false,
      commercialRevShare: 0,
      derivativesAllowed: false,
      derivativesAttribution: false,
      derivativesApproval: false,
      derivativesReciprocal: false,
    };

    switch (licenseSettings.pilType) {
      case 'open_use':
        return {
          ...baseTerms,
          royaltyPolicy: "0x0000000000000000000000000000000000000000" as `0x${string}`,
          commercializerChecker: "0x0000000000000000000000000000000000000000" as `0x${string}`,
          commercializerCheckerData: "0x" as `0x${string}`,
          currency: "0x0000000000000000000000000000000000000000" as `0x${string}`,
          commercialUse: false,
          derivativesAllowed: true,
        };
      
      case 'non_commercial_remix':
        return {
          ...baseTerms,
          royaltyPolicy: "0x0000000000000000000000000000000000000000" as `0x${string}`,
          commercializerChecker: "0x0000000000000000000000000000000000000000" as `0x${string}`,
          commercializerCheckerData: "0x" as `0x${string}`,
          currency: "0x0000000000000000000000000000000000000000" as `0x${string}`,
          commercialUse: false,
          derivativesAllowed: true,
          derivativesAttribution: true,
          derivativesReciprocal: true,
        };
      
      case 'commercial_use':
        return {
          ...baseTerms,
          royaltyPolicy: "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E" as `0x${string}`,
          commercializerChecker: "0x0000000000000000000000000000000000000000" as `0x${string}`,
          commercializerCheckerData: "0x" as `0x${string}`,
          currency: "0x1514000000000000000000000000000000000000" as `0x${string}`,
          defaultMintingFee: BigInt(licenseSettings.licensePrice),
          commercialUse: true,
          commercialAttribution: true,
        };
      
      case 'commercial_remix':
        return {
          ...baseTerms,
          royaltyPolicy: "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E" as `0x${string}`,
          commercializerChecker: "0x0000000000000000000000000000000000000000" as `0x${string}`,
          commercializerCheckerData: "0x" as `0x${string}`,
          currency: "0x1514000000000000000000000000000000000000" as `0x${string}`,
          defaultMintingFee: BigInt(licenseSettings.licensePrice),
          commercialUse: true,
          commercialAttribution: true,
          commercialRevShare: licenseSettings.revShare,
          derivativesAllowed: true,
          derivativesAttribution: true,
          derivativesReciprocal: true,
        };
      
      default:
        return {
          ...baseTerms,
          royaltyPolicy: "0x0000000000000000000000000000000000000000" as `0x${string}`,
          commercializerChecker: "0x0000000000000000000000000000000000000000" as `0x${string}`,
          commercializerCheckerData: "0x" as `0x${string}`,
          currency: "0x0000000000000000000000000000000000000000" as `0x${string}`,
        };
    }
  };

  // Register IP Asset
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

      const licenseTerms = getLicenseTerms();

      const response = await storyClient.ipAsset.mintAndRegisterIpAssetWithPilTerms({
        spgNftContract: "0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc" as `0x${string}`,
        licenseTermsData: [{
          terms: licenseTerms,
          licensingConfig: {
            isSet: false,
            mintingFee: BigInt(licenseSettings.licensePrice),
            licensingHook: "0x0000000000000000000000000000000000000000" as `0x${string}`,
            hookData: "0x" as `0x${string}`,
            commercialRevShare: licenseSettings.revShare,
            disabled: false,
            expectMinimumGroupRewardShare: 0,
            expectGroupRewardPool: "0x0000000000000000000000000000000000000000" as `0x${string}`,
          }
        }],
        ipMetadata: {
          ipMetadataURI: `https://ipfs.io/ipfs/${ipMetadataCid}`,
          ipMetadataHash: `0x${createHash('sha256').update(JSON.stringify(ipMetadata)).digest('hex')}` as `0x${string}`,
          nftMetadataURI: `https://ipfs.io/ipfs/${nftMetadataCid}`,
          nftMetadataHash: `0x${createHash('sha256').update(JSON.stringify(nftMetadata)).digest('hex')}` as `0x${string}`,
        }
      });

      setResult(response);
      setCurrentStep(5); // Move to success step

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
    if (currentStep < 4) {
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

  // Reset form
  const resetForm = () => {
    setCurrentStep(1);
    setSelectedFile(null);
    setImagePreview(null);
    setAiDetection(null);
    setTitle('');
    setDescription('');
    setResult(null);
    setHasAutoSlided(false);
    setLicenseSettings({
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
  };

  if (!isConnected) {
    return (
      <div style={styles.container}>
        <div style={styles.walletCard} className="animate-fadeIn">
          <span style={styles.walletIcon}>👛</span>
          <h2 style={{ fontSize: 'clamp(24px, 5vw, 32px)', color: '#1E293B', marginBottom: '1rem' }}>Connect Your Wallet</h2>
          <p style={{ fontSize: 'clamp(16px, 3vw, 18px)', color: '#6B7280' }}>To start protecting your creative assets</p>
        </div>
      </div>
    );
  }

  const progressPercent = ((currentStep - 1) / 3) * 100;

  return (
    <div style={styles.container}>
      <div style={styles.card} className="animate-fadeIn">
        {/* Progress Steps */}
        {currentStep < 5 && (
          <div style={styles.progressContainer}>
            <div style={styles.progressLine} className="progress-line">
              <div style={{ ...styles.progressLineActive, width: `${progressPercent}%` }}></div>
            </div>
            
            {[
              { icon: '📤', label: 'Upload' },
              { icon: '🤖', label: 'AI Scan' },
              { icon: '📝', label: 'Details' },
              { icon: '⚡', label: 'Register' }
            ].map((step, index) => (
              <div key={index} style={styles.step}>
                <div style={{
                  ...styles.stepCircle,
                  ...(currentStep > index + 1 ? styles.stepCircleCompleted : {}),
                  ...(currentStep === index + 1 ? styles.stepCircleActive : {})
                }}>
                  {currentStep > index + 1 ? '✓' : step.icon}
                </div>
                <div style={{
                  ...styles.stepLabel,
                  ...(currentStep === index + 1 ? styles.stepLabelActive : {})
                }}>
                  {step.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 1: Upload */}
        {currentStep === 1 && (
          <div>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="fileInput"
            />
            <div 
              onClick={() => document.getElementById('fileInput')?.click()}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              style={{
                ...styles.uploadArea,
                ...(isHovering ? styles.uploadAreaHover : {})
              }}
              className="upload-area"
            >
              <div style={styles.uploadIcon} className="animate-pulse">📁</div>
              <h3 style={{ fontSize: 'clamp(20px, 4vw, 24px)', marginBottom: '0.5rem', color: '#1E293B' }}>
                Drop your file here
              </h3>
              <p style={{ color: '#6B7280', fontSize: 'clamp(14px, 2.5vw, 16px)' }}>or click to browse • PNG, JPG, GIF up to 10MB</p>
            </div>

            {imagePreview && (
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <img src={imagePreview} alt="Preview" style={styles.previewImage} />
                <p style={{ marginTop: '1rem', color: '#6B7280', fontWeight: 500, fontSize: 'clamp(14px, 2.5vw, 16px)' }}>
                  {selectedFile?.name}
                </p>
              </div>
            )}

            {selectedFile && !hasAutoSlided && (
              <div style={{ textAlign: 'center', marginTop: '2rem', padding: '1rem', background: '#E0F2FE', borderRadius: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Loader2 size={20} className="animate-spin" style={{ color: '#0284C7' }} />
                  <span style={{ color: '#0284C7', fontWeight: 600, fontSize: 'clamp(14px, 2.5vw, 16px)' }}>Preparing AI analysis...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: AI Analysis */}
        {currentStep === 2 && (
          <div>
            {isDetecting ? (
              <div style={{ textAlign: 'center', padding: 'clamp(2rem, 5vw, 3rem)' }}>
                <div style={styles.spinner}></div>
                <h3 style={{ fontSize: 'clamp(20px, 4vw, 24px)', marginTop: '1rem', color: '#1E293B' }}>
                  Analysis in Progress
                </h3>
                <p style={{ color: '#6B7280', marginTop: '0.5rem', fontSize: 'clamp(14px, 2.5vw, 16px)' }}>
                  Our smart robots are examining your image... 🔍
                </p>
              </div>
            ) : (
              aiDetection && (
                <div style={styles.aiDetectionCard}>
                  {aiDetection.isAI && (
                    <div style={styles.aiBadge} className="animate-bounce">AI Detected!</div>
                  )}
                  <h3 style={{ fontSize: 'clamp(20px, 4vw, 24px)', marginBottom: '1rem', color: 'black' }}>Analysis Complete</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ 
                        fontSize: 'clamp(24px, 6vw, 36px)', 
                        fontWeight: 700, 
                        color: aiDetection.isAI ? '#F59E0B' : '#10B981', 
                        marginBottom: '0.5rem' 
                      }}>
                        {aiDetection.isAI ? 'AI-Generated' : 'Original'}
                      </div>
                      <div style={{ fontSize: 'clamp(12px, 2vw, 14px)', color: '#6B7280' }}>Content Type</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 'clamp(24px, 6vw, 36px)', fontWeight: 700, color: '#3B82F6', marginBottom: '0.5rem' }}>
                        {(aiDetection.confidence * 100).toFixed(0)}%
                      </div>
                      <div style={{ fontSize: 'clamp(12px, 2vw, 14px)', color: '#6B7280' }}>Confidence</div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* Step 3: Asset Details */}
        {currentStep === 3 && (
          <div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Asset Name *</label>
              <input 
                type="text" 
                style={styles.formInput}
                placeholder="Give your asset a memorable name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Category</label>
              <select style={styles.formInput}>
                <option>🎨 Digital Art</option>
                <option>📸 Photography</option>
                <option>✏️ Illustration</option>
                <option>🎯 Design</option>
                <option>🌟 Other</option>
              </select>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Description *</label>
              <textarea 
                style={{ ...styles.formInput, minHeight: '120px', resize: 'vertical' }}
                placeholder="Tell us about your creation..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 4: License & Register */}
        {currentStep === 4 && (
          <div>
            <h3 style={{ fontSize: 'clamp(20px, 4vw, 24px)', marginBottom: '1.5rem', color: '#1F2937' }}>Choose Your License</h3>
            
            <div style={styles.licenseGrid} className="license-grid">
              {[
                { 
                  id: 'open_use', 
                  icon: '🎁', 
                  title: 'Open Use', 
                  desc: 'Free for non-commercial use',
                },
                { 
                  id: 'non_commercial_remix', 
                  icon: '🔄', 
                  title: 'Non-Commercial Remix', 
                  desc: 'Allow remixing, no commercial use',
                },
                { 
                  id: 'commercial_use', 
                  icon: '💼', 
                  title: 'Commercial Use', 
                  desc: 'Allow commercial use, no derivatives',
                },
                { 
                  id: 'commercial_remix', 
                  icon: '🎨', 
                  title: 'Commercial Remix', 
                  desc: 'Full commercial rights with revenue sharing',
                }
              ].map((license) => (
                <div
                  key={license.id}
                  onClick={() => setLicenseSettings(prev => ({ 
                    ...prev, 
                    pilType: license.id,
                    ...(license.id === 'open_use' && {
                      commercialUse: false,
                      derivativesAllowed: true,
                      attribution: false,
                      revShare: 0,
                      licensePrice: 0
                    }),
                    ...(license.id === 'non_commercial_remix' && {
                      commercialUse: false,
                      derivativesAllowed: true,
                      attribution: false,
                      revShare: 0,
                      licensePrice: 0
                    }),
                    ...(license.id === 'commercial_use' && {
                      commercialUse: true,
                      derivativesAllowed: false,
                      attribution: false,
                      revShare: 0
                    }),
                    ...(license.id === 'commercial_remix' && {
                      commercialUse: true,
                      derivativesAllowed: true,
                      attribution: false
                    })
                  }))}
                  style={{
                    ...styles.licenseCard,
                    ...(licenseSettings.pilType === license.id ? styles.licenseCardSelected : {})
                  }}
                  className="license-card"
                >
                  <div style={{ fontSize: 'clamp(24px, 6vw, 36px)', marginBottom: '0.5rem' }}>{license.icon}</div>
                  <div style={styles.licenseCardTitle}>{license.title}</div>
                  <div style={styles.licenseCardDesc}>{license.desc}</div>
                </div>
              ))}
            </div>

            {/* Custom Settings for Commercial Licenses */}
            {(licenseSettings.pilType === 'commercial_use' || licenseSettings.pilType === 'commercial_remix') && (
              <div style={styles.customSettings}>
                <h4 style={{ marginBottom: '1rem', color: '#1F2937', fontSize: 'clamp(16px, 3vw, 18px)' }}>License Settings</h4>
                
                <div style={styles.settingRow} className="setting-row">
                  <span style={{ fontWeight: 600, color: '#374151', fontSize: 'clamp(14px, 2.5vw, 16px)' }}>License Price ($IP)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={licenseSettings.licensePrice}
                    onChange={(e) => setLicenseSettings(prev => ({ 
                      ...prev, 
                      licensePrice: parseFloat(e.target.value) || 0
                    }))}
                    style={styles.settingInput}
                    placeholder="0.00"
                  />
                </div>

                {licenseSettings.pilType === 'commercial_remix' && (
                  <div style={styles.settingRow} className="setting-row">
                    <span style={{ fontWeight: 600, color: '#374151', fontSize: 'clamp(14px, 2.5vw, 16px)' }}>Revenue Share (%)</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={licenseSettings.revShare}
                      onChange={(e) => setLicenseSettings(prev => ({ 
                        ...prev, 
                        revShare: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                      }))}
                      style={styles.settingInput}
                      placeholder="0"
                    />
                  </div>
                )}
              </div>
            )}
            
            {/* AI Learning Toggle - hanya untuk non-AI content */}
            {!aiDetection?.isAI && (
              <div style={styles.toggleContainer} className="toggle-container">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: 'clamp(20px, 4vw, 24px)' }}>🤖</span>
                  <span style={{ fontWeight: 600, color: '#1F2937', fontSize: 'clamp(14px, 2.5vw, 16px)' }}>Allow AI Training</span>
                </div>
                <div 
                  onClick={() => setLicenseSettings(prev => ({ ...prev, aiLearning: !prev.aiLearning }))}
                  style={{
                    ...styles.toggleSwitch,
                    ...(licenseSettings.aiLearning ? styles.toggleSwitchActive : {})
                  }}
                  className="toggle-switch"
                >
                  <div style={{
                    ...styles.toggleKnob,
                    left: licenseSettings.aiLearning ? '33px' : '3px'
                  }}></div>
                </div>
              </div>
            )}
            
            <button 
              onClick={registerIP}
              disabled={isRegistering}
              style={{
                ...styles.button,
                ...styles.buttonPrimary,
                ...(isRegistering ? styles.buttonDisabled : {}),
                width: '100%',
                fontSize: 'clamp(16px, 3vw, 20px)',
                padding: 'clamp(1rem, 3vw, 1.5rem)'
              }}
            >
              {isPreparingTx ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  <span>Preparing Transaction...</span>
                </>
              ) : isRegistering ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  <span>Awaiting Signature...</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 'clamp(20px, 4vw, 24px)' }}>🚀</span>
                  <span>Register My Asset!</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Success State */}
        {currentStep === 5 && result && (
          <div style={styles.successContainer}>
            <span style={styles.successIcon} className="animate-bounce">✅</span>
            <h2 style={{ fontSize: 'clamp(24px, 5vw, 32px)', color: '#1E293B', marginBottom: '1rem' }}>Woohoo! 🎉</h2>
            <p style={{ fontSize: 'clamp(16px, 3vw, 18px)', color: '#6B7280', marginBottom: '2rem' }}>
              Your asset is now protected on Story!
            </p>
            
            <div style={styles.resultInfo}>
              <div style={styles.resultItem} className="result-item">
                <span style={{ fontWeight: 600, fontSize: 'clamp(14px, 2.5vw, 16px)' }}>Transaction ID</span>
                <a 
                  href={`https://aeneid.storyscan.io/tx/${result.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ 
                    color: '#7C3AED', 
                    fontFamily: 'monospace', 
                    fontSize: 'clamp(12px, 2vw, 14px)',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    wordBreak: 'break-all'
                  }}
                >
                  {result.txHash?.slice(0, 10)}...{result.txHash?.slice(-8)}
                </a>
              </div>
              <div style={{ ...styles.resultItem, borderBottom: 'none' }} className="result-item">
                <span style={{ fontWeight: 600, fontSize: 'clamp(14px, 2.5vw, 16px)' }}>IP Asset ID</span>
                <a 
                  href={`https://aeneid.explorer.story.foundation/ipa/${result.ipId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ 
                    color: '#7C3AED', 
                    fontFamily: 'monospace', 
                    fontSize: 'clamp(12px, 2vw, 14px)',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    wordBreak: 'break-all'
                  }}
                >
                  {result.ipId?.slice(0, 10)}...{result.ipId?.slice(-8)}
                </a>
              </div>
            </div>
            
            <button 
              onClick={resetForm}
              style={{
                ...styles.button,
                ...styles.buttonPrimary,
                marginTop: '2rem'
              }}
            >
              <span style={{ fontSize: 'clamp(16px, 3vw, 20px)' }}>🎨</span>
              <span>Register Another Asset</span>
            </button>
          </div>
        )}

        {/* Navigation Buttons */}
        {currentStep < 5 && currentStep > 1 && (
          <div style={styles.navigationButtons} className="navigation-buttons">
            <button 
              onClick={prevStep}
              style={{
                ...styles.button,
                ...styles.buttonSecondary,
                flex: '1'
              }}
            >
              <span>←</span>
              <span>Previous</span>
            </button>
            
            {currentStep < 4 && (
              <button 
                onClick={nextStep}
                disabled={
                  (currentStep === 2 && !canProceedFromStep2()) ||
                  (currentStep === 3 && !canProceedFromStep3())
                }
                style={{
                  ...styles.button,
                  ...styles.buttonPrimary,
                  ...((currentStep === 2 && !canProceedFromStep2()) ||
                     (currentStep === 3 && !canProceedFromStep3()) ? styles.buttonDisabled : {}),
                  flex: '1'
                }}
              >
                <span>Next</span>
                <span>→</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
