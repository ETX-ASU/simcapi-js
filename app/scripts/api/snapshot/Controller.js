define(['api/snapshot/Transporter'], function(Transporter){
  return {
    notifyOnReady: Transporter.getInstance().notifyOnReady,
    triggerCheck : Transporter.getInstance().triggerCheck
  };
});