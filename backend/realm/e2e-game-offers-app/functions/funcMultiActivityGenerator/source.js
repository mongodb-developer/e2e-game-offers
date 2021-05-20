exports = function(arg) {
  /*
   * This function repeatedly calls the activity generator function to scale
   * beyond the single invocation per minute of the trigger.
   *
   * Date          Version        Author            Notes
   * --------------------------------------------------------------
   * 2021-05-13    1.0            Roy Kiesler       Initial version
   *
   */
   
  const numActivitiesPerRun = 1;
  
  for (let i=0; i < numActivitiesPerRun; i++) {
    context.functions.execute("funcActivityGenerator");
  }
};