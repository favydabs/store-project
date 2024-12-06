import { MongoClient, GridFSBucket } from 'mongodb';
import { Readable } from 'stream';
import { ObjectId } from 'mongodb';

// Initialize MongoDB connection using your existing DATABASE_URL
const client = new MongoClient(process.env.DATABASE_URL as string);
let bucket: GridFSBucket;

// Connect and initialize GridFS bucket
async function initializeGridFS() {
  if (!bucket) {
    await client.connect();
    const db = client.db(); // This will automatically use the 'store' database from your connection string
    bucket = new GridFSBucket(db, {
      bucketName: 'images'
    });
  }
  return bucket;
}

export const uploadImage = async (image: File): Promise<string> => {
  const bucket = await initializeGridFS();
  
  // Create a unique filename
  const timestamp = Date.now();
  const newName = `${timestamp}-${image.name}`;
  
  // Convert File to Buffer
  const buffer = await image.arrayBuffer();
  const stream = Readable.from(Buffer.from(buffer));
  
  // Upload file to GridFS
  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(newName, {
      contentType: image.type,
      metadata: {
        originalName: image.name,
        uploadDate: new Date(),
      }
    });

    stream.pipe(uploadStream)
      .on('error', (error) => reject(error))
      .on('finish', () => {
        // Construct and return public URL
        const fileId = uploadStream.id.toString();
        const publicUrl = `/api/images/${fileId}`;
        resolve(publicUrl);
      });
  });
};

export const deleteImage = async (url: string): Promise<void> => {
  const bucket = await initializeGridFS();
  
  // Extract fileId from URL
  const fileId = url.split('/').pop();
  if (!fileId) throw new Error('Invalid URL');
  
  try {
    // Delete file from GridFS
    await bucket.delete(new ObjectId(fileId));
  } catch (error: unknown) {
    // Properly type the error and provide a fallback message
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    throw new Error(`Failed to delete image: ${errorMessage}`);
  }
};

// API route to serve images
export const getImage = async (fileId: string) => {
  const bucket = await initializeGridFS();
  return bucket.openDownloadStream(new ObjectId(fileId));
};