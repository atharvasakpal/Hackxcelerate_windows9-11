
# Android Device Management

A web-app which makes handling multiple android devices/ emulators easier. 
The devices are connected wirelessly by TCP/IP connection and the system files and be monitored and modified using Android Device Bridge.
Also included the functionality of android sceen mirroring using SCRCPY.

Login Authentication included and passwords stored in the database after hashing via bcrypt.



## API Reference

#### To show all connected devices

```http
  adb devices
```

#### To use Screen Mirroring

```http
  scrcpy -s <device>
```



## Installation

git clone the project and use npm

```bash
  npm i
  node app.js
```
    
## Tech Stack

**Client:** css 

**Server:** Node, Express


## Screenshots

![login](https://raw.githubusercontent.com/atharvasakpal/Hackxcelerate_windows9-11/main/screenshots/WhatsApp%20Image%202024-03-23%20at%2012.26.57.jpeg)

![pairing](https://raw.githubusercontent.com/atharvasakpal/Hackxcelerate_windows9-11/main/screenshots/WhatsApp%20Image%202024-03-23%20at%2012.27.24.jpeg)

![connected devices](https://raw.githubusercontent.com/atharvasakpal/Hackxcelerate_windows9-11/main/screenshots/WhatsApp%20Image%202024-03-23%20at%2012.28.45.jpeg)

![](https://raw.githubusercontent.com/atharvasakpal/Hackxcelerate_windows9-11/main/screenshots/WhatsApp%20Image%202024-03-23%20at%2012.29.01.jpeg)

![](https://raw.githubusercontent.com/atharvasakpal/Hackxcelerate_windows9-11/main/screenshots/WhatsApp%20Image%202024-03-23%20at%2012.29.50.jpeg)

![](https://raw.githubusercontent.com/atharvasakpal/Hackxcelerate_windows9-11/main/screenshots/WhatsApp%20Image%202024-03-23%20at%2012.30.07.jpeg)

![](https://raw.githubusercontent.com/atharvasakpal/Hackxcelerate_windows9-11/main/screenshots/WhatsApp%20Image%202024-03-23%20at%2012.30.20.jpeg)



## Team Members (Windows9/11)

- Ishayu Potey
- Atharva Sakpal
- Nayanesh Gudla
- Keyur Apte

