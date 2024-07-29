const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Membaca config.json
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

const client = new Client({
    authStrategy: new LocalAuth()
});

// Buat folder database jika belum ada
const dbFolderPath = path.join(__dirname, 'database');
if (!fs.existsSync(dbFolderPath)) {
    fs.mkdirSync(dbFolderPath);
}

// Buat atau baca premium.json
const premiumFilePath = path.join(dbFolderPath, 'premium.json');
let premiumData = {};
if (fs.existsSync(premiumFilePath)) {
    premiumData = JSON.parse(fs.readFileSync(premiumFilePath, 'utf8'));
} else {
    fs.writeFileSync(premiumFilePath, JSON.stringify(premiumData, null, 2));
}

// Buat atau baca antilink.json
const antilinkFilePath = path.join(dbFolderPath, 'antilink.json');
let antilinkData = {};
if (fs.existsSync(antilinkFilePath)) {
    antilinkData = JSON.parse(fs.readFileSync(antilinkFilePath, 'utf8'));
} else {
    fs.writeFileSync(antilinkFilePath, JSON.stringify(antilinkData, null, 2));
}

function isPremium(userNumber) {
    return premiumData[userNumber] && new Date(premiumData[userNumber].expires) > new Date();
}


// Objek untuk menyimpan command dan deskripsinya
const commands = {
    ping: 'Balasan sederhana dengan "pong"',
    howgay: 'Mengetahui seberapa gay kamu',
    kalcinta: 'Mengetahui persentase cinta antara dua nama. Gunakan: kalcinta <nama1> <nama2>',
    menu: 'Menampilkan semua perintah yang tersedia',
    toall: 'Mengirim pesan ke semua grup. Hanya bisa digunakan oleh owner. Gunakan: toall <chat>',
    register: 'Mendaftar dengan format: register <nama>.<umur>. Umur minimal adalah 13 tahun.',
    giveprem: 'Memberikan status premium. Gunakan: giveprem <nama> <berapa hari>',
    kick: 'Menendang anggota dari grup. Hanya bisa digunakan oleh admin. Gunakan: kick <reply/tag>',
    add: 'Menambahkan nomor ke grup. Hanya bisa digunakan oleh admin. Gunakan: add <nomer>',
    antilink: 'Mengatur fitur anti-link. Hanya bisa digunakan oleh admin. Gunakan: antilink <on/off>',
    del: 'Menghapus pesan dengan cara me-reply pesan yang ingin dihapus. Gunakan: del atau delete <reply>',
    ai: 'Menggunakan API AI untuk mendapatkan respons. Gunakan: ai <chat/text>',
     ffstalk: 'Mengambil data dari Free Fire Stalker. Gunakan: ffstalk <id>',
    mlstalk: 'Mengambil data dari Mobile Legends Stalker. Gunakan: mlstalk <id> <zone>'
};

// Fungsi untuk mencatat log ke terminal
function logCommand(user, command) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${user}: ${command}`;
    console.log(logMessage);
}

// Fungsi untuk menghasilkan menu
function generateMenu() {
    let menu = 'Daftar Perintah:\n';
    for (const command in commands) {
        menu += `.${command} - ${commands[command]}\n`;
    }
    return menu;
}

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Scan kode QR di atas dengan WhatsApp Anda.');
});

client.on('ready', () => {
    console.log('Bot sudah siap!');
});

client.on('message', async message => {
    // Daftar prefix yang diterima
    const prefixes = ['.', '/', ','];

    // Cek apakah pesan dimulai dengan salah satu prefix
    const prefix = prefixes.find(p => message.body.startsWith(p));

    if (prefix) {
        const command = message.body.slice(prefix.length).trim().split(' ')[0];
        const args = message.body.slice(prefix.length).trim().split(' ').slice(1);

        // Catat log perintah yang digunakan
        logCommand(message.from, message.body);

        if (command === 'ping') {
            message.reply('pong');
        } else if (command === 'howgay') {
            const gayPercentage = Math.floor(Math.random() * 100) + 1;
            message.reply(`Kamu ${gayPercentage}% gay!`);
        } else if (command === 'kalcinta') {
            if (args.length !== 2) {
                message.reply('Gunakan format: ' + prefix + 'kalcinta <nama1> <nama2>');
            } else {
                const lovePercentage = Math.floor(Math.random() * 100) + 1;
                message.reply(`Persentase cinta antara ${args[0]} dan ${args[1]} adalah ${lovePercentage}%!`);
            }
        } else if (command === 'menu') {
            message.reply(generateMenu());
        } else if (command === 'toall') {
            const senderNumber = message.author ? message.author.split('@')[0] : message.from.split('@')[0];
            console.log('Sender Number:', senderNumber);
            console.log('Config Owners:', config.owner);

            if (!config.owner.includes(senderNumber)) {
                message.reply('Anda tidak memiliki izin untuk menggunakan perintah ini.');
                return;
            }

            if (args.length < 1) {
                message.reply('Gunakan format: ' + prefix + 'toall <chat>');
            } else {
                const chatMessage = args.join(' ');
                const chats = await client.getChats();
                let groupCount = 0;

                chats.forEach(chat => {
                    if (chat.isGroup) {
                        chat.sendMessage(chatMessage);
                        groupCount++;
                    }
                });

                message.reply(`Pesan telah dikirim ke ${groupCount} grup.`);
            }
        } 
     
    
    
        else if (command === 'ai') {
            if (args.length === 0) {
                message.reply('Gunakan format: ' + prefix + 'ai <chat/text>');
                return;
            }

            const query = args.join(' ');

            try {
                const response = await axios.get(`https://api.yanzbotz.my.id/api/ai/chatgpt?query=${encodeURIComponent(query)}`);
                const result = response.data.result;
                message.reply(result);
            } catch (error) {
                console.error('Error fetching AI response:', error);
                message.reply('Terjadi kesalahan saat mendapatkan respons AI.');
            }
        }
        
        else if (command === 'register') {
            if (args.length !== 1) {
                message.reply('Gunakan format: ' + prefix + 'register <nama>.<umur>');
                return;
            }

            const [nama, umurStr] = args[0].split('.');
            const umur = parseInt(umurStr);

            if (!nama || isNaN(umur) || umur < 13) {
                message.reply('Umur minimal adalah 13 tahun dan format harus: ' + prefix + 'register <nama>.<umur>');
                return;
            }

            const userNumber = message.from.split('@')[0];
            const userFilePath = path.join(dbFolderPath, `${userNumber}.json`);

            // Cek apakah pengguna sudah terdaftar
            if (fs.existsSync(userFilePath)) {
                message.reply('Anda sudah terdaftar. Tidak dapat mendaftar lagi.');
                return;
            }

            const userData = {
                nama,
                umur,
                nomor: userNumber
            };

            fs.writeFileSync(userFilePath, JSON.stringify(userData, null, 2));

            message.reply(`Pendaftaran berhasil! Nama: ${nama}, Umur: ${umur}`);
        } else if (command === 'giveprem') {
            if (args.length !== 2) {
                message.reply('Gunakan format: ' + prefix + 'giveprem <nama> <berapa hari>');
                return;
            }

            const [nama, hariStr] = args;
            const hari = parseInt(hariStr);

            if (isNaN(hari) || hari <= 0) {
                message.reply('Jumlah hari harus berupa angka positif.');
                return;
            }

            let userNumber = null;
            fs.readdirSync(dbFolderPath).forEach(file => {
                const userFilePath = path.join(dbFolderPath, file);
                const userData = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));

                if (userData.nama === nama) {
                    userNumber = userData.nomor;
                }
            });

            if (!userNumber) {
                message.reply(`Pengguna dengan nama ${nama} tidak ditemukan.`);
                return;
            }

            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + hari);

            premiumData[userNumber] = {
                nama,
                expires: expiryDate.toISOString()
            };

            fs.writeFileSync(premiumFilePath, JSON.stringify(premiumData, null, 2));

            message.reply(`Status premium diberikan kepada ${nama} selama ${hari} hari.`);
        } else if (command === 'kick') {
            const chat = await message.getChat();
            if (!chat.isGroup) {
                message.reply('Perintah ini hanya bisa digunakan di dalam grup.');
                return;
            }

            const senderNumber = message.author ? message.author.split('@')[0] : message.from.split('@')[0];
            const participants = await chat.participants;
            const isAdmin = participants.find(participant => participant.id._serialized === message.author && participant.isAdmin);

            if (!isAdmin) {
                message.reply('Hanya admin yang dapat menggunakan perintah ini.');
                return;
            }

            let target = null;
            if (message.hasQuotedMsg) {
                const quotedMsg = await message.getQuotedMessage();
                target = quotedMsg.author || quotedMsg.from;
            } else if (message.mentionedIds.length > 0) {
                target = message.mentionedIds[0];
            }

            if (!target) {
                message.reply('Anda harus me-reply pesan pengguna atau mention pengguna yang ingin di-kick.');
                return;
            }

            const targetNumber = target.split('@')[0];
            const targetParticipant = participants.find(participant => participant.id._serialized === target);

            if (!targetParticipant) {
                message.reply('Pengguna tersebut bukan anggota grup.');
                return;
            }

            if (targetParticipant.isAdmin) {
                message.reply('Tidak bisa meng-kick sesama admin.');
                return;
            }

            try {
                await chat.removeParticipants([target]);
                message.reply(`Pengguna dengan nomor ${targetNumber} telah di-kick dari grup.`);
            } catch (err) {
                message.reply('Gagal meng-kick pengguna. Pastikan bot memiliki izin admin.');
            }
        } else if (command === 'add') {
            if (args.length !== 1) {
                message.reply('Gunakan format: ' + prefix + 'add <nomer>');
                return;
            }

            const targetNumber = args[0].replace(/[^0-9]/g, '') + '@c.us';

            try {
                const chat = await message.getChat();
                if (!chat.isGroup) {
                    message.reply('Perintah ini hanya bisa digunakan di dalam grup.');
                    return;
                }

                const senderNumber = message.author ? message.author.split('@')[0] : message.from.split('@')[0];
                const participants = await chat.participants;
                const isAdmin = participants.find(participant => participant.id._serialized === message.author && participant.isAdmin);

                if (!isAdmin) {
                    message.reply('Hanya admin yang dapat menggunakan perintah ini.');
                    return;
                }

                await chat.addParticipants([targetNumber]);
                message.reply(`Pengguna dengan nomor ${targetNumber.split('@')[0]} telah ditambahkan ke grup.`);
            } catch (err) {
                message.reply('Gagal menambahkan pengguna. Pastikan nomor yang dimasukkan benar dan bot memiliki izin admin.');
            }
        } else if (command === 'antilink') {
            const chat = await message.getChat();
            if (!chat.isGroup) {
                message.reply('Perintah ini hanya bisa digunakan di dalam grup.');
                return;
            }

            const senderNumber = message.author ? message.author.split('@')[0] : message.from.split('@')[0];
            const participants = await chat.participants;
            const isAdmin = participants.find(participant => participant.id._serialized === message.author && participant.isAdmin);

            if (!isAdmin) {
                message.reply('Hanya admin yang dapat menggunakan perintah ini.');
                return;
            }

            if (args.length !== 1 || (args[0] !== 'on' && args[0] !== 'off')) {
                message.reply('Gunakan format: ' + prefix + 'antilink <on/off>');
                return;
            }

            const groupId = chat.id._serialized;
            const status = args[0] === 'on';

            antilinkData[groupId] = status;
            fs.writeFileSync(antilinkFilePath, JSON.stringify(antilinkData, null, 2));

            message.reply(`Fitur anti-link telah ${status ? 'diaktifkan' : 'dinonaktifkan'}.`);
        } else if (command === 'del' || command === 'delete') {
            const chat = await message.getChat();
            if (!chat.isGroup) {
                message.reply('Perintah ini hanya bisa digunakan di dalam grup.');
                return;
            }

            const senderNumber = message.author ? message.author.split('@')[0] : message.from.split('@')[0];
            const participants = await chat.participants;
            const isAdmin = participants.find(participant => participant.id._serialized === message.author && participant.isAdmin);

            if (!isAdmin) {
                message.reply('Hanya admin yang dapat menggunakan perintah ini.');
                return;
            }

            if (!message.hasQuotedMsg) {
                message.reply('Anda harus me-reply pesan yang ingin dihapus.');
                return;
            }

            const quotedMsg = await message.getQuotedMessage();

            try {
                await quotedMsg.delete(true);
                message.reply('Pesan telah dihapus.');
            } catch (err) {
                message.reply('Gagal menghapus pesan. Pastikan bot memiliki izin admin.');
            }
        }
    } else {
        // Cek apakah fitur anti-link aktif
        const chat = await message.getChat();
        if (chat.isGroup) {
            const groupId = chat.id._serialized;

            if (antilinkData[groupId]) {
                if (message.body.includes('https://')) {
                    const participants = await chat.participants;
                    const isAdmin = participants.find(participant => participant.id._serialized === message.author && participant.isAdmin);

                    if (isAdmin) {
                        message.reply('ANDA ADALAH ADMIN, MAKA SAYA TIDAK AKAN MENG KICK ANDA!!');
                    } else {
                        try {
                            await chat.removeParticipants([message.author || message.from]);
                            message.reply('Anda telah di-kick karena mengirim link.');
                        } catch (err) {
                            message.reply('Gagal meng-kick pengguna. Pastikan bot memiliki izin admin.');
                        }
                    }
                }
            }
        }
    }
});

client.initialize();
