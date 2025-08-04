const registerIP = async () => {
  if (!storyClient || !selectedFile || !address) return;
  setIsRegistering(true);
  setIsPreparingTx(true);
  try {
    const { payload } = await uploadMetadataAndRegister({
      storyClient,
      file: selectedFile,
      address,
      title,
      description,
      aiDetection,
      licenseSettings
    });

    setIsPreparingTx(false);

    await storyClient.ipAsset.mintAndRegisterIpAssetWithPilTerms({
      ...payload,
      pilTerms: {
        type: licenseSettings.pilType,
        commercialUse: licenseSettings.commercialUse,
        aiTrainingUse: licenseSettings.aiLearning,
        revShare: licenseSettings.revShare,
        territory: licenseSettings.territory
      }
    });

    alert('IP asset registered successfully!');
  } catch (error) {
    console.error('Registration failed:', error);
  } finally {
    setIsRegistering(false);
    setIsPreparingTx(false);
  }
};
