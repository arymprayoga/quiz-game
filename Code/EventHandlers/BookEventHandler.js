const httpClient = require('../HttpClient');

class BookEventHandler {
    static register(socket, _connection, _server, _player) {
        // Download book
        socket.on('downloadBuku', async function (data) {
            console.log(data);
            try {
                const res = await httpClient.get('/download-buku/' + data, true); // use cache
                socket.emit('downloadBuku', { linkBuku: res.data });
                console.log(res.data);
            } catch (error) {
                console.log(error);
                console.log('Error download buku');
            }
        });

        // List books
        socket.on('listBuku', async function (data) {
            try {
                const res = await httpClient.get('/list-buku/' + data, true); // use cache
                socket.emit('listBuku', res.data);
                console.log(res.data);
            } catch (error) {
                console.log(error);
                console.log('Error di list buku');
            }
        });

        // Search books
        socket.on('searchBuku', async function (data) {
            try {
                const res = await httpClient.get('/search-buku/' + data, true); // use cache
                socket.emit('searchBuku', {daftarBuku : res.data});
                console.log(res.data);
            } catch (error) {
                console.log(error);
                console.log('Error di kirim soal');
            }
        });
    }
}

module.exports = BookEventHandler;
