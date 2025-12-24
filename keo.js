
setInterval(() => {
    document.getElementById('clock').textContent = new Date().toLocaleTimeString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' });
}, 1000);


document.addEventListener('click', (e) => {
    const cc = document.getElementById('control-center');
    const trigger = document.getElementById('status-trigger');
    const menus = document.querySelectorAll('.dropdown');
    const menuTriggers = document.querySelectorAll('.menu-item-wrap');
    
  
    if (!cc.contains(e.target) && !trigger.contains(e.target)) {
        cc.classList.remove('open');
    }
    

    let clickedMenu = false;
    menuTriggers.forEach(mt => { if(mt.contains(e.target)) clickedMenu = true; });
    
    if (!clickedMenu) {
        menus.forEach(m => m.classList.remove('show'));
    }
});


let zIndex = 100;
const os = {
    open: (id) => {
        const win = document.getElementById(id);
        if(!win) return;
        win.classList.add('open');
        
        if (id === 'win-preview') win.style.transform = 'translate(-50%, -50%) scale(1)';
        else win.style.transform = 'scale(1)';
        
        win.style.opacity = '1';
        win.style.pointerEvents = 'auto';
        os.focus(id);
    },
    close: (id) => {
        const win = document.getElementById(id);
        win.classList.remove('open');
        win.style.opacity = '0';
        win.style.pointerEvents = 'none';
        
        if (id === 'win-preview') win.style.transform = 'translate(-50%, -50%) scale(0.9)';
        else win.style.transform = 'scale(0.9)';

        if(id === 'win-music') musicApp.pause();
        if(id === 'win-video') document.getElementById('video-element').pause();
    },
    minimize: (id) => {
        const win = document.getElementById(id);
        win.style.transform = 'translateY(100px) scale(0.8)';
        win.style.opacity = '0';
        win.style.pointerEvents = 'none';
    },
    minimizeAll: () => {
        document.querySelectorAll('.window').forEach(w => os.minimize(w.id));
    },
    closeAll: () => {
        document.querySelectorAll('.window').forEach(w => os.close(w.id));
    },
    focus: (id) => {
        zIndex++;
        document.getElementById(id).style.zIndex = zIndex;
    },
    dragStart: (e, id) => {
        const win = document.getElementById(id);
        os.focus(id);
        let shiftX = e.clientX - win.getBoundingClientRect().left;
        let shiftY = e.clientY - win.getBoundingClientRect().top;
        
        function moveAt(pageX, pageY) {
            if(id === 'win-preview') {
                 win.style.left = pageX - shiftX + 'px';
                 win.style.top = pageY - shiftY + 'px';
                 win.style.transform = 'none'; 
            } else {
                win.style.left = pageX - shiftX + 'px';
                win.style.top = pageY - shiftY + 'px';
            }
        }
        function onMouseMove(event) { moveAt(event.clientX, event.clientY); }
        document.addEventListener('mousemove', onMouseMove);
        document.onmouseup = function() {
            document.removeEventListener('mousemove', onMouseMove);
            document.onmouseup = null;
        };
    },
    toggleControlCenter: () => document.getElementById('control-center').classList.toggle('open'),
    toggleMenu: (id) => {
     
        document.querySelectorAll('.dropdown').forEach(d => {
            if(d.id !== id) d.classList.remove('show');
        });
        document.getElementById(id).classList.toggle('show');
    },
    setBrightness: (val) => document.getElementById('desktop').style.filter = `brightness(${val}%)`
};


const systemFiles = [];

const filesApp = {
    handleUpload: (input) => {
        const files = Array.from(input.files);
        files.forEach(file => {
            const url = URL.createObjectURL(file);
            const type = file.type.startsWith('image') ? 'image' : 
                         file.type.startsWith('audio') ? 'audio' :
                         file.type.startsWith('video') ? 'video' : 'unknown';
            
          
            systemFiles.push({ name: file.name, url: url, type: type });
            
           
            if(type === 'image') photoApp.add(url);
            if(type === 'audio') musicApp.add(file.name, url);
            if(type === 'video') videoApp.add(file.name, url);
        });
        
        filesApp.render();
        input.value = ''; 
    },
    render: () => {
        const container = document.getElementById('files-list');
        container.innerHTML = systemFiles.map(f => {
            let icon = 'fa-file';
            if(f.type === 'image') icon = 'fa-file-image';
            if(f.type === 'audio') icon = 'fa-file-audio';
            if(f.type === 'video') icon = 'fa-file-video';
            
            return `
            <div class="file-icon" onclick="filesApp.openFile('${f.url}', '${f.type}')">
                <i class="fas ${icon}"></i>
                <span>${f.name}</span>
            </div>`;
        }).join('');
    },
    openFile: (url, type) => {
        if(type === 'image') {
            document.getElementById('preview-img').src = url;
            os.open('win-preview');
        } else if (type === 'audio') {
            os.open('win-music');
        } else if (type === 'video') {
            os.open('win-video');
        } else {
            alert('Cannot open this file type.');
        }
    }
};


const settingsApp = {
    defaultWp: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1920&q=80',
    
    setWallpaper: (input) => {
        const file = input.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const url = e.target.result;
            settingsApp.apply(url);
            try { localStorage.setItem('ikura_wp', url); } 
            catch(e) { alert('Image too large to save permanently, but active now!'); }
        };
        reader.readAsDataURL(file);
    },
    
    reset: () => {
        localStorage.removeItem('ikura_wp');
        settingsApp.apply(settingsApp.defaultWp);
        document.getElementById('wp-upload').value = ""; 
    },
    
    apply: (url) => {
        document.getElementById('desktop').style.backgroundImage = `url('${url}')`;
        document.getElementById('wp-preview').style.backgroundImage = `url('${url}')`;
    },
    
    loadSaved: () => {
        const saved = localStorage.getItem('ikura_wp');
        settingsApp.apply(saved ? saved : settingsApp.defaultWp);
    }
};

settingsApp.loadSaved();


const browserApp = {
    go: () => {
        const urlInput = document.getElementById('browser-url');
        const iframe = document.getElementById('browser-frame');
        let url = urlInput.value.trim();
        if (!url.startsWith('http')) url = 'https://' + url;
        iframe.src = url;
    }
};


const musicApp = {
    playlist: [
        { title: "Demo Song", src: "Track1.mp3" } 
    ],
    idx: 0,
    audio: new Audio(),
    isPlaying: false,

    init: () => {
        musicApp.renderList();
        
    },
    add: (name, url) => {
        musicApp.playlist.push({ title: name, src: url });
        musicApp.renderList();
    },
    renderList: () => {
        const list = document.getElementById('music-list');
        list.innerHTML = musicApp.playlist.map((t, i) => `
            <div class="track-item" onclick="musicApp.play(${i})">
                <span>${i+1}. ${t.title}</span>
            </div>
        `).join('');
    },
    play: (i) => {
        musicApp.idx = i;
        musicApp.audio.src = musicApp.playlist[i].src;
        musicApp.audio.play();
        musicApp.isPlaying = true;
        document.getElementById('music-title').innerText = musicApp.playlist[i].title;
        document.getElementById('play-btn').innerHTML = '<i class="fas fa-pause"></i>';
    },
    toggle: () => {
        if (!musicApp.audio.src) return; // Do nothing if no song loaded
        if(musicApp.isPlaying) {
            musicApp.audio.pause();
            musicApp.isPlaying = false;
            document.getElementById('play-btn').innerHTML = '<i class="fas fa-play"></i>';
        } else {
            musicApp.audio.play();
            musicApp.isPlaying = true;
            document.getElementById('play-btn').innerHTML = '<i class="fas fa-pause"></i>';
        }
    },
    pause: () => {
        musicApp.audio.pause();
        musicApp.isPlaying = false;
        document.getElementById('play-btn').innerHTML = '<i class="fas fa-play"></i>';
    },
    next: () => {
        if(musicApp.playlist.length > 0) musicApp.play((musicApp.idx + 1) % musicApp.playlist.length);
    },
    prev: () => {
        if(musicApp.playlist.length > 0) musicApp.play((musicApp.idx - 1 + musicApp.playlist.length) % musicApp.playlist.length);
    }
};
musicApp.init();


const videoApp = {
  
    playlist: [
        { title: "Demo Video", src: "video.mp4" }
    ],
    
    init: () => { videoApp.render(); },
    add: (name, url) => {
        videoApp.playlist.push({ title: name, src: url });
        videoApp.render();
    },
    render: () => {
        const list = document.getElementById('video-list');
        if(videoApp.playlist.length === 0) {
            list.innerHTML = '<div style="padding:10px; color:#666;">No videos. Upload in Files app.</div>';
            return;
        }
        list.innerHTML = videoApp.playlist.map((v, i) => `
            <div class="video-item" onclick="videoApp.play(${i})">
                <i class="fas fa-play-circle"></i> ${v.title}
            </div>
        `).join('');
    },
    play: (i) => {
        const vid = document.getElementById('video-element');
        vid.src = videoApp.playlist[i].src;
        vid.play();
    }
};
videoApp.init();


const photoApp = {
    
    list: ["pic1.jpg", "pic2.jpg"],
    
    init: () => { photoApp.render(); },
    add: (url) => {
        photoApp.list.push(url);
        photoApp.render();
    },
    render: () => {
        const grid = document.getElementById('photo-grid');
        if(photoApp.list.length === 0) {
            grid.innerHTML = '<div style="padding:10px; color:#666; width:200px;">No photos. Upload in Files app.</div>';
            return;
        }
        grid.innerHTML = photoApp.list.map(src => `
            <div class="photo-item" style="background-image:url('${src}')" 
            onclick="document.getElementById('preview-img').src='${src}'; os.open('win-preview');">
            </div>
        `).join('');
    }
};
photoApp.init();
photoApp.init();


const notesApp = {
    save: () => localStorage.setItem('ikura_notes', document.getElementById('notes-input').value)
};
document.getElementById('notes-input').value = localStorage.getItem('ikura_notes') || '';