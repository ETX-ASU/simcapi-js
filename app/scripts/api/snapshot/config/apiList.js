define(function() {
    return {
        ChemicalAPI: ['getStructure'],
        DeviceAPI: ['createDevice', 'deleteDevice', 'listDevicesInGroup', 'authenticateDevice'],
        DataSyncAPI: ['createSession', 'joinSession', 'endSession', 'setSessionData', 'getSessionData']
    };
});
