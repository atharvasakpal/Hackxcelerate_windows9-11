const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const passport = require('passport');
const {exec} = require('child_process');
const LocalStrategy = require('passport-local').Strategy;
const crypto = require('crypto');
const adb = require('adbkit'); 
const path =  require('path');

const client = adb.createClient();
const disconnectDevices = (req, res, next) => {
  // Execute ADB command to disconnect devices
  exec('adb disconnect', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).send('Error occurred');
    }
    if (stderr) {
      console.error(`ADB Error: ${stderr}`);
      return res.status(500).send('ADB Error occurred');
    }
    console.log('Disconnected ADB devices');
    next();
  });
};


const UserModel = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

const secretKey = crypto.randomBytes(32).toString('hex');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    req.userId = decoded.userId;
    next();
  });
};

// API endpoint to fetch account data
app.get('/account', verifyToken, async (req, res) => {
  try {
    // Fetch account data from MongoDB using user ID
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Send the user account data as JSON response
    res.json(user);
  } catch (error) {
    console.error('Error fetching account data:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = { verifyToken };
// Connect to MongoDB
mongoose.connect('mongodb+srv://demouser:demouser@waspmote.gp4logi.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(error => console.error('Error connecting to MongoDB:', error));

// Body parser middleware
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: 'xcelerate',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ 
    mongoUrl: 'mongodb+srv://demouser:demouser@waspmote.gp4logi.mongodb.net/',
    dbName: 'Button',
    collectionName: 'LED'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Passport Local Strategy
passport.use(new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password'
}, async (username, password, done) => {
  try {
    const user = await UserModel.findOne({ username });
    if (!user) {
      return done(null, false); // User not found
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return done(null, false); // Invalid password
    }

    return done(null, user); // User authenticated successfully
  } catch (error) {
    console.error('Error authenticating user:', error);
    return done(error); // Internal server error
  }
}));

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await UserModel.findById(id);
    done(null, user);
  } catch (error) {
    console.error('Error deserializing user:', error);
    done(error);
  }
});

// Set view engine
app.set('view engine', 'ejs');

// Redirect root path to login page (optional)
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Routes
app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/login',disconnectDevices, passport.authenticate('local', { successRedirect: '/homepage', failureRedirect: '/login', failureFlash: true }));

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await UserModel.findOne({ username });
    if (existingUser) {
      return res.render('register', { registerError: 'Username already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = new UserModel({ username, password: hashedPassword });
    await newUser.save();
    res.redirect('/login');
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).send('Error registering user');
  }
});

// Logout route
app.get('/logout', (req, res) => {
  // Execute adb disconnect command to disconnect all adb devices
  exec('adb disconnect', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).send('Error occurred during adb disconnect');
    }
    if (stderr) {
      console.error(`ADB Error: ${stderr}`);
      return res.status(500).send('ADB Error occurred during adb disconnect');
    }
    console.log(`ADB Disconnect successful: ${stdout}`);
    
    // Perform logout operations (e.g., clearing session)
    req.logout();
    res.redirect('/login');
  });
});
// Logout route
// Logout route
app.post('/logout', disconnectDevices, (req, res, next) => {
  // Assuming you are using Express session
  req.session.destroy((err) => {
    if (err) {
      // If there's an error during logout, pass it to the next middleware
      return next(err);
    }
    // Redirect the user to the login page after logout
    res.redirect('/login');
  });
});

app.get('/homepage', (req, res) => {
  if (req.isAuthenticated()) {
    // Render the homepage content here
    res.render('homepage', { user: req.user }); // Optional: Pass user data to the template
  } else {
    res.redirect('/login');
  }
});

app.get('/connecteddevices',(req,res)=>{
  res.render('connecteddevices.ejs');
})



app.post('/connecteddevices',(req,res)=>{
  // res.send('post request successful!') 
  exec(`adb devices`,(error,stdout,stderr)=>{
    //error handling
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).send('Error occurred');
    }
    if (stderr) {
      console.error(`ADB Error: ${stderr}`);
      return res.status(500).send('ADB Error occurred');
    }
  
    //showing the devices
    const devices= stdout.split('\n').slice(1).filter(line => line.trim() !== '').map(line => {
      const [device, state] = line.trim().split('\t');
      return { device, state };
    });
    //get the list of deviceNames
    // let deviceName = [];
    // for (i of devices){
    //   // deviceName.push(exec(`adb -s ${i['device']} shell getprop ro.product.marketname`));
    //   deviceName.push(i['device']);
    // }
    // res.send(deviceName);
    // res.send(devices);
     res.render('connecteddevices',{devices});
  }) 
});







app.get('/pairdevice',(req,res)=>{
res.render('pairdevice.ejs');
})

app.post('/pairdevice',(req,res)=>{
  
  const {ipaddress,pairingport,password,port} = req.body;
  //res.send(`Entered ip: ${ipaddress} Entered key: ${password}`);
  exec(`adb pair ${ipaddress}:${pairingport} ${password}`,(error, stdout,stderr)=>{
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).send('Error occurred during pairing');
    }
    if (stderr) {
      console.error(`ADB Error: ${stderr}`);
      return res.status(500).send('ADB Error occurred during pairing');
    }
    console.log(`Pairing successful: ${stdout}`);
    console.log(ipaddress)
    // res.send(`Pairing successful <a href='/connectDevice'>connect Device</a>`);
    res.render('connectDevice');
  })
  

app.get('/connectDevice',(req,res)=>{
  res.render('connectDevice');
})    
app.post('/connectDevice',(req,res)=>{
  const {port} = req.body; 
 exec(`adb connect ${ipaddress}:${port}`,(error, stdout,stderr)=>{
     if (error) {
       console.error(`Error: ${error.message}`);
       return res.status(500).send('Error occurred during pairing');
     }
     if (stderr) {
       console.error(`ADB Error: ${stderr}`);
       return res.status(500).send('ADB Error occurred during pairing');
     }
     console.log(`Connection successful: ${stdout}`);
     res.send(`Pairing & Connection successful <a href='/homepage'>home</a>`);
   })
})



   // .then(res.redirect('/'))
   // .then(res.send('paired successfully!'))
   // .catch(err=>{console.log(err)})
});

app.get('/screenmirror',(req,res)=>{

  exec(`adb devices`,(error,stdout,stderr)=>{
    //error handling
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).send('Error occurred');
    }
    if (stderr) {
      console.error(`ADB Error: ${stderr}`);
      return res.status(500).send('ADB Error occurred');
    }
  
    //showing the devices
    const devices= stdout.split('\n').slice(1).filter(line => line.trim() !== '').map(line => {
      const [device, state] = line.trim().split('\t');
      return { device, state };
    });
    //get the list of deviceNames
    // let deviceName = [];
    // for (i of devices){
    //   // deviceName.push(exec(`adb -s ${i['device']} shell getprop ro.product.marketname`));
    //   deviceName.push(i['device']);
    // }
    // res.send(deviceName);
    // res.send(devices);
     res.render('screenmirror',{devices});
  }) 

  app.post('/screenmirror',(req,res)=>{
  
    // res.send('post request of screen mirror')
     const mirrorDevice = req.body.deviceSelect;
    
    //scrcpy code
  
    exec(`scrcpy -s ${mirrorDevice}`,(error, stdout, stderr)=>{
      if(error){
        res.send(`Error: ${error.message}`);
      }
      if (stderr) {
        res.send(`scrcpy Error: ${stderr}`);
      }
  
      //output
      console.log(stdout);
    })
  
    // console.log(mirrorDevice);
    
  })
  });

  app.get('/deviceDetails',(req,res)=>{

    exec(`adb devices`,(error,stdout,stderr)=>{
      //error handling
      if (error) {
        console.error(`Error: ${error.message}`);
        return res.status(500).send('Error occurred');
      }
      if (stderr) {
        console.error(`ADB Error: ${stderr}`);
        return res.status(500).send('ADB Error occurred');
      }
    
      //showing the devices
      const devices= stdout.split('\n').slice(1).filter(line => line.trim() !== '').map(line => {
        const [device, state] = line.trim().split('\t');
        return { device, state };
      });
      //get the list of deviceNames
      // let deviceName = [];
      // for (i of devices){
      //   // deviceName.push(exec(`adb -s ${i['device']} shell getprop ro.product.marketname`));
      //   deviceName.push(i['device']);
      // }
      // res.send(deviceName);
      // res.send(devices);
       res.render('deviceDetails',{devices});
    }) 
  })


app.post('/deviceDetails',(req,res)=>{
  
   
  const detailsDevice = req.body.deviceDetails;
 
  exec(`adb -s ${detailsDevice} shell "getprop | grep -e \'model\' -e \'version.sdk\' -e \'manufacturer\' -e \'hardware\' -e \'platform\' -e \'revision\' -e \'serialno\' -e \'product.name\' -e \'brand\'"`, (error, stdout, stderr) => {
    if (error) {
        console.error(`Error executing ADB command: ${error}`);
        return res.status(500).json({ error: 'An error occurred' });
    }
    if (stderr) {
        console.error(`ADB command error: ${stderr}`);
        return res.status(500).json({ error: 'An error occurred' });
    }
    // Split the output into lines and parse relevant properties
    const properties = {};
    stdout.split('\n').filter(Boolean).forEach(line => {
        const [key, value] = line.split(':').map(part => part.trim());
        properties[key] = value;
    });
    // res.json(properties);
    res.render('Details',{properties})
});
//  res.render('showDeviceDetails',{batteryPercentage});
});



app.get('/openADBshell',(req,res)=>{
  // exec(`adb devices`,(error,stdout,stderr)=>{
  //   //error handling
  //   if (error) {
  //     console.error(`Error: ${error.message}`);
  //     return res.status(500).send('Error occurred');
  //   }
  //   if (stderr) {
  //     console.error(`ADB Error: ${stderr}`);
  //     return res.status(500).send('ADB Error occurred');
  //   }
  
  //   //showing the devices
  //   const devices= stdout.split('\n').slice(1).filter(line => line.trim() !== '').map(line => {
  //     const [device, state] = line.trim().split('\t');
  //     return { device, state };
  //   });
  //   //get the list of deviceNames
  //   // let deviceName = [];
  //   // for (i of devices){
  //   //   // deviceName.push(exec(`adb -s ${i['device']} shell getprop ro.product.marketname`));
  //   //   deviceName.push(i['device']);
  //   // }
  //   // res.send(deviceName);
  //   // res.send(devices);


  //   // const openShell = req.body.openADBshell;
    // res.send('Post request working');
    const command  = `adbshell.bat `;
    //executing the batch file with the IP address passed as an argument
    exec(command, (error,stdout,stderr)=>{
      if(error){
        console.error(`exec error: ${error}`);
        return res.status(500).send('Error executing command');
      }
      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);
      res.send('ADB shell opened successfully');
    })
    //  res.render('openADBshell',{devices});
})


// app.post('/openADBshell',(req,res)=>{
    
// })




// //scrcpy
// app.get('/scrcpy',(req,res)=>{
// res.send('get request scrcpy');
// })
// app.post('/scrcpy',(req,res)=>{
//   // res.send(req.body);
//   exec('scrcpy -s 192.168.0.169:40953',(error, stdout, stderr)=>{
//     if(error){
//       res.send(`Error: ${error.message}`);
//     }
//     if (stderr) {
//       res.send(`scrcpy Error: ${stderr}`);
//     }

//     //output
//     console.log(stdout);
//   })
// })


app.listen(3000, () => {
  console.log(`Server started on port 3000`);
});
