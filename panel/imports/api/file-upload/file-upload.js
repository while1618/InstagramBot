import { FilesCollection } from 'meteor/ostrio:files';

export const Files = new FilesCollection({
    debug: false,
    storagePath: '/var/InstagramBot/uploads',
    permissions: 0o774,
    parentDirPermissions: 0o774,
    collectionName: 'files',
    allowClientCode: false, // Disallow remove files from Client
    onBeforeUpload: function (file) {
        // Allow upload files under 20MB, and only in png/jpg/jpeg formats
        if (file.size >= 1024 * 1024 * 20)
            return 'File is too large, 20MB is max size';
        if (!/png|jpe?g|mp4|avi|mov|flv|wmv/i.test(file.extension))
            return 'Not allowed format';
        return true;
    }
});
