define(function() {
    return {
        ChemicalAPI: ['getStructure'],
        DeviceAPI: ['listDevicesInGroup'],
        DataSyncAPI: ['createSession', 'joinSession', 'endSession', 'setSessionData', 'getSessionData'],
        InchRepoService: ['search']
    };
});
