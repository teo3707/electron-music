/**
 * mp3 格式解析
 */
(function (window) {
    let Mp3 = window.Mp3 = {};

    let ID3V2_3_FRAMES = [
        'AENC', 'APIC', 'COMM', 'COMR', 'ENCR', 'EQUA', 'ETCO', 'GEOB', 'GRID',
        'IPLS', 'LINK', 'MCDI', 'MLLT', 'OWNE', 'PRIV', 'PCNT', 'POPM', 'POSS',
        'RBUF', 'RVAD', 'RVRB', 'SYLT', 'SYTC', 'TALB', 'TBPM', 'TCOM', 'TCON',
        'TCOP', 'TDAT', 'TDLY', 'TENC', 'TEXT', 'TFLT', 'TIME', 'TIT1', 'TIT2',
        'TIT3', 'TKEY', 'TLAN', 'TLEN', 'TMED', 'TOAL', 'TOFN', 'TOLY', 'TOPE',
        'TORY', 'TOWN', 'TPE1', 'TPE2', 'TPE3', 'TPE4', 'TPOS', 'TPUB', 'TRCK',
        'TRDA', 'TRSN', 'TRSO', 'TSIZ', 'TSRC', 'TSSE', 'TYER', 'TXXX', 'UFID',
        'USER', 'USLT', 'WCOM', 'WCOP', 'WOAF', 'WOAR', 'WOAS', 'WORS', 'WPAY',
        'WPUB', 'WXXX'];

    Mp3.parseID3 = function(buffer) {

    };

    /**
     * ID3V2.3格式解析
     */
    Mp3.parseID3V2 = function(buffer) {
        let result = {};

        let cursor = 0;
        let header = buffer.slice(cursor, cursor + 3);
        cursor += 3;
        if ('' + header !== 'ID3') {
            throw 'wrong ID3V2 format';
        }
        let version = buffer.slice(cursor, cursor + 1);
        cursor += 1;                                    // 版本号ID3V2.3就记录3
        if (version.readInt8() !== 3) {
            throw `wrong ID3V2.3 format: ${version.readInt8()}`;
        }

        cursor += 1;                                    // 副版本号
        cursor += 1;                                    // 存放标志的字节
        let size = buffer.slice(cursor, cursor + 4);    // 标签大小，包括标签头的10个字节和所有的标签帧的大小
        cursor += 4;

        size = (size[0] & 0x7F) * 0x200000 + (size[1] & 0x7F) * 0x400 + (size[2] & 0x7F) * 0x80 + (size[3] & 0x7F);
        while (true) {
            let frameId = buffer.slice(cursor, cursor + 4);     // 用四个字符标识一个帧
            cursor += 4;
            if (!ID3V2_3_FRAMES.includes('' + frameId)) {
                break;
            }

            let frameSize = buffer.slice(cursor, cursor + 4);   // 帧内容的大小，不包括帧头，不得小于1
            cursor += 4;
            frameSize =  frameSize[0] * 0x100000000 + frameSize[1] * 0x10000 + frameSize[2] * 0x100 + frameSize[3];

            let frameFlag = buffer.slice(cursor, cursor + 2);   // 存放标志
            cursor += 2;

            let encode;
            switch ('' + frameId) {
                // mp3名称
                case 'TIT2':
                    encode = buffer.slice(cursor, cursor + 1).readInt8();
                    cursor += 1;
                    result.songName = buffer.slice(cursor, cursor + frameSize - 1).toString(getFrameEncode(encode));
                    cursor += frameSize - 1;
                    break;

                // mp3作者
                case 'TPE1':
                case 'TPE2':
                case 'TPE3':
                    encode = buffer.slice(cursor, cursor + 1).readInt8();
                    cursor += 1;
                    result.author = result.author
                        ? (result.author + buffer.slice(cursor, cursor + frameSize - 1).toString(getFrameEncode(encode)))
                        : buffer.slice(cursor, cursor + frameSize - 1).toString(getFrameEncode(encode));
                    cursor += frameSize - 1;
                    break;

                // mp3封面
                case 'APIC':
                    // 前13个字节为mime类型
                    result.thumbnail = buffer.slice(cursor + 13, cursor + frameSize);
                    cursor += frameSize;
                    result.apic = `${cursor - frameSize + 13},${cursor}`;
                    break;

                // Album/Movie/Show title
                case 'TALB':
                    encode = buffer.slice(cursor, cursor + 1).readInt8();
                    cursor += 1;
                    result.albumName = buffer.slice(cursor, cursor + frameSize - 1).toString(getFrameEncode(encode));
                    cursor += frameSize - 1;
                    break;

                default:
                    cursor += frameSize;
            }

        }
        return result;
    };

    function getFrameEncode(encode) {
        if (encode === 0x00) {
            return 'ascii';
        }

        if (encode === 0x01) {
            return 'utf16le';
        }

        return 'utf8';
    }
} (window));
