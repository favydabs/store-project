import { createClient } from '@supabase/supabase-js';

const bucket = 'main-bucket';

export const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_KEY as string
);

export const uploadImage = async (image: File) => {
  try {
    // Log file details for debugging
    console.log('Uploading file:', {
      name: image.name,
      size: image.size,
      type: image.type
    });

    const timestamp = Date.now();
    const newName = `${timestamp}-${image.name}`;
    
    // Perform the upload and capture both data and error
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(newName, image, { cacheControl: '3600' });
    
    // Log the complete response
    console.log('Upload response:', { data, error });

    if (error) {
      // Throw the specific error from Supabase
      throw new Error(`Upload failed: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('Upload succeeded but returned no data');
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(newName);
      
    return urlData.publicUrl;
  } catch (err) {
    // Log the full error object
    console.error('Full error details:', err);
    throw err;
  }
};
// export const uploadImage = async (image: File) => {
//   const timestamp = Date.now();
//   const newName = `${timestamp}-${image.name}`;
//   const { data } = await supabase.storage
//     .from(bucket)
//     .upload(newName, image, { cacheControl: '3600' });
//   if (!data) throw new Error('Image upload failed');
//   return supabase.storage.from(bucket).getPublicUrl(newName).data.publicUrl;
// };

export const deleteImage = (url: string) => {
  const imageName = url.split('/').pop();
  if (!imageName) throw new Error('Invalid URL');
  return supabase.storage.from(bucket).remove([imageName]);
};
