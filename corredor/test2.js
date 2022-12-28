// https://stackabuse.com/executing-shell-commands-with-node-js/
const { promisify } = require('util');
const exec = promisify(require('child_process').exec)

export default {
  label: "Execute",
  description: "Use System call",

  triggers ({ on }) {
    /**
     * Due to how the Corredor scripting system is designed right now,
     * triggers still need to be defined (even if the script is
     * executed explicitly from the workflow).
     */
    return on('manual')
        .for('system')
  },

  security: {
    runAs: 'bot'
  },


  async exec (args, { Compose, System }) {
    // unpack arguments
    const { cmd, cmdargs, dir } = args

    try {
//    const  { stdout, stderr } = await exec(cmd + " "+ cmdargs,{
    const  { stdout, stderr } = await exec("ls -l",{
      cwd: dir
    })
    return {
      result: {
         stdout: stdout.trim(),
         stderr: stderr.trim()
      }
    }
//    console.log('stdout:', stdout);
//    console.log('stderr:', stderr);
    } catch (e) {
      console.log(e); // should contain code (exit code) and signal (that caused the termination).
    }

  }
}