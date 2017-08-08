using System;
using System.Threading.Tasks;
using System.Diagnostics;
using System.IO;
using System.Security.Cryptography;

public class Startup
{
    /*
    class CancellationManager
    {
        public Func<object, Task<object>> cancel;
        public Func<object, Task<object>> reset;
        public Func<object, Task<object>> isCancelled;
    }
    */

    class StatusTrayItem
    {
        public Func<object, Task<object>> setProgress;
        public Func<object, Task<object>> reset;
    }

    public int getProgress(long current, long total)
    {
        int progress = (int)Math.Round((double)current * 100 / total);
        if (progress > 100)
        {
            progress = 100;
        }
        return progress;
    }

    public async Task<object> Invoke(dynamic package)
    {
        // TODO:
        // - create error message on wrong password
        // - on cancel: close and delete file
        // - on wrong password: close and delete file!
        // - create a better filen name
        // - could be check md5 hash on the files but it make this slow
        // - improve logging
        // - Make the whole thing cancellable (Progress.isCancelled())

        // Variables
        dynamic Constants = package.Constants;
        string InputFile = (string)package.data.InputFile;
        string OutputFile = (string)package.data.OutputFile;
        string Password = (string)package.data.Password;
        
        string LogFile = (string)package.data.LogFile;
        
        string Id = (string)package.data.Id;

        // Constants
        var CURRENT = Constants.Progress.Current;
        int PROGRESS_STEPSIZE = Constants.Progress.BufferedStepSizeSmallest;


        // Progress functions
        var Progress = new StatusTrayItem();
        Progress.setProgress = (Func<object, Task<object>>) package.data.StatusTray.setProgress;
        Progress.reset = (Func<object, Task<object>>) package.data.StatusTray.reset;

        // CancellationManager
        //var cm = new CancellationManager();
        //cm.cancel = (Func<object, Task<object>>)package.data.CancellationManager.cancel;
        //cm.reset = (Func<object, Task<object>>)package.data.CancellationManager.reset;
        //cm.isCancelled = (Func<object, Task<object>>)package.data.CancellationManager.isCancelled;

        
        Console.WriteLine("Started decryption");
        try
        {
            FileStream fsOut = new FileStream(OutputFile, FileMode.Create);

            FileStream fsCrypt = new FileStream(InputFile, FileMode.Open);

            try
            {
                // Create log folder if it doesn't exist
                (new FileInfo(LogFile)).Directory.Create();

                byte[] passwordBytes = System.Text.Encoding.UTF8.GetBytes(Password);
                byte[] salt = new byte[32];



                Console.WriteLine("Looking for the salt.");
                fsCrypt.Read(salt, 0, salt.Length);

                Console.WriteLine("Generating key");
                RijndaelManaged AES = new RijndaelManaged();

                AES.KeySize = 256;
                AES.BlockSize = 128;

                var key = new Rfc2898DeriveBytes(passwordBytes, salt, Constants.Encryption.HashIterations);
                Console.WriteLine("Generated key");
                AES.Key = key.GetBytes(AES.KeySize / 8);
                AES.IV = key.GetBytes(AES.BlockSize / 8);
                AES.Padding = PaddingMode.PKCS7;
                AES.Mode = CipherMode.CFB;


                CryptoStream cs = new CryptoStream(fsCrypt, AES.CreateDecryptor(), CryptoStreamMode.Read);
                Console.WriteLine("Created CryptoStream");


                int read;
                byte[] buffer = new byte[1048576];


                long totalBytes = new FileInfo(InputFile).Length;
                long readBytes = 0;

                int progress = 0;
                int progress_last = 0;

                while ((read = cs.Read(buffer, 0, buffer.Length)) > 0)
                {
                    /*
                    if ((bool)await cm.isCancelled(null))
                    {
                        Console.WriteLine("Extraction was cancelled ...");
                        await Progress.reset(new { type = CURRENT });
                        File.AppendAllText(LogFile, "Extraction was cancelled ...");
                        break;
                    }
                    */
                    readBytes += read;
                    fsOut.Write(buffer, 0, read);

                    progress = getProgress(readBytes, totalBytes);



                    if ((progress - progress_last) > PROGRESS_STEPSIZE || progress == 100)
                    {
                        await Progress.setProgress(new { type = CURRENT, value = progress });
                        progress_last = progress;
                    }
                    Console.WriteLine("Decrypting: " + progress + " %");

                }

                await Progress.setProgress(new { type = CURRENT, value = 100 });
                

                Console.WriteLine("Closing CryptoStream");
                try
                {
                    cs.Close();
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Error while closing CryptoStream: " + ex.Message);
                    // TODO: Cancel progress
                    return false;
                }
            }
            catch (System.Security.Cryptography.CryptographicException ex_CryptographicException)
            {
                Console.WriteLine("CryptographicException error: " + ex_CryptographicException.Message);
                // TODO: Cancel progress
                return false;
            }
            catch (IOException ex)
            {
                Console.WriteLine("Cant access file: " + ex.Message);
                return false;
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error: " + ex.Message);
                // TODO: Cancel progress
                return false;
            }
            finally
            {
                Console.WriteLine("Closing files");
                try
                {
                    fsOut.Close();
                    fsCrypt.Close();
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Couldn't close files: " + ex.Message);
                }
            }
        } catch(Exception ex)
        {
            Console.WriteLine("Error while decrypting file. Error message: " + ex.Message);
        }
        

        Console.WriteLine("Done decrypting the file.");


        return true;
    }
}