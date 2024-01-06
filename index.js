const { Client, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');
const express = require('express');

const app = express();
const port = 3000;

// Connect to MongoDB
mongoose.connect('mongodb+srv://XottikMW:System1153@cluster0.6qmd0dw.mongodb.net/?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
    
    const projectSchema = new mongoose.Schema({
      code: String,
      status: String,
      name: String, // Add name field to the schema
      user: String, // Add user field to the schema
    });

    const Project = mongoose.model('Project', projectSchema);

    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages, // Add this intent to enable direct message events
      ],
    });

    client.on('ready', () => {
      console.log(`Logged in as ${client.user.tag}`);
    });

    client.on('messageCreate', async (message) => {
      if (message.content.startsWith('!submit')) {
        // Generate a random code
        const generatedCode = Math.random().toString(36).substring(7);

        // Extract name from the message
        const name = message.content.split(' ').slice(1).join(' ');

        // Create a new project entry
        const newProject = new Project({
          code: generatedCode,
          status: 'In Review',
          name: name,
          user: message.author.tag,
        });

        await newProject.save();
        
        // Send the information to the channel
        message.reply(`Project "${name}" has been submitted by ${message.author} and is now in review.`);

        // Send the code to the user via DM
        message.author.send(`Your project "${name}" has been submitted with code: ${generatedCode}. Use !status ${generatedCode} to check the status of your project.`);

        // Send the information to the bot owner
        const botOwner = await client.users.fetch('661557499056619520'); // Replace with your bot owner's ID
        botOwner.send(`New project submission:\nName: ${name}\nCode: ${generatedCode}\nUser: ${message.author.tag}`);
      }

      if (message.content.startsWith('!status')) {
        // Extract code from the message
        const code = message.content.split(' ')[1];

        // Find the project in the database
        const project = await Project.findOne({ code });

        if (!project) {
          message.reply('No project found with the provided code.');
          return;
        }

        message.reply(`Project status for code ${code}: ${project.status}`);
      }

      if (message.content.startsWith('!edit')) {
        // Extract code and new status from the message
        const args = message.content.split(' ');
        const code = args[1];
        const newStatus = args.slice(2).join(' ');

        // Find the project in the database
        const project = await Project.findOne({ code });

        if (!project) {
          message.reply('No project found with the provided code.');
          return;
        }

        // Update the project status
        project.status = newStatus;
        await project.save();

        message.reply(`Project status for code ${code} has been updated to: ${newStatus}`);
      }
    });

    // Start the Express server
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });

    // Log in to Discord
    client.login('MTEyNjM3MjExMzQzNjExNDk3NA.GkCh_t.DxCKfSE0XaPN6Wk1V-9JWLZjUkN47uZzcl5Ss4');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });
