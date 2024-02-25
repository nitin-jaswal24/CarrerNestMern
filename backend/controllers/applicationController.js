import { catchAsyncError } from '../middlewares/catchAsyncErrors.js';
import ErrorHandler from '../middlewares/error.js';
import { Application } from '../models/application.js';
import { Job } from '../models/job.js';
import cloudinary from 'cloudinary';

export const employerGetAllApplications = catchAsyncError(
    async (req, res, next) => {
      const { role } = req.user;
      if (role === "Job Seeker") {
        return next(
          new ErrorHandler("Job Seeker not allowed to access this resource.", 400)
        );
      }
      const { _id } = req.user;
      const applications = await Application.find({ "employerID.user": _id });
      res.status(200).json({
        success: true,
        applications,
      });
    }
  );

  export const jobseekerGetAllApplications = catchAsyncError(
    async (req, res, next) => {
      const { role } = req.user;
      if (role === "Employer") {
        return next(
          new ErrorHandler("Employer not allowed to access this resource.", 400)
        );
      }
      const { _id } = req.user;
      const applications = await Application.find({ "applicantID.user": _id });
      if(applications.length===0){
        return res.status(400).json({
            success:false,
            message:"No applicatoins exist"
        })
      }
      res.status(200).json({
        success: true,
        applications,
      });
    }
  );



  export const jobseekerDeleteApplication = catchAsyncError(
    async (req, res, next) => {
        const { role } = req.user;
        if (role === "Employer") {
            return next(
                new ErrorHandler("Employer not allowed to access this resource.", 400)
                );
            }
            const { id } = req.params;
            const application = await Application.findByIdAndDelete(id);
            if(!application){
                return res.status(404).json({
                    success:false,
                    message:"No application found!"
                })
            }
            // console.log("deleting");
    //         if (!application) {
    //     return next(new ErrorHandler("Application not found!", 404));
    //   }
    //   await application.deleteOne();
      res.status(200).json({
        success: true,
        message: "Application Deleted!",
      });
    }
  );

// export const postApplication = catchAsyncError(async (req, res, next) => {
//     const { role } = req.user;
//     if (role === 'Employer') {
//         throw new ErrorHandler("You are not allowed to access this resource", 400);
//     }
//     if (!req.files || Object.keys(req.files).length === 0) {
//         throw new ErrorHandler("Resume File Required");
//     }

//     const { resume } = req.files;
//     const allowedFormats = ['image/png', 'image/jpg', 'image/webp'];
//     if (!allowedFormats.includes(resume.mimetype)) {
//         throw new ErrorHandler("Invalid file type, Please upload a valid file type");
//     }

//     const cloudinaryRes = await cloudinary.uploader.upload(
//         resume.tempFilePath
//     );
//     if (!cloudinaryRes || cloudinaryRes.error) {
//         throw new ErrorHandler("Failed to upload resume", 500);
//     }

//     // Getting other params
//     const { name, email, coverLetter, phone, jobId } = req.body;
//     const applicantId = {
//         user: req.user._id,
//         role: "Job Seeker"
//     };

//     if (!jobId) {
//         throw new ErrorHandler("Job not found!", 404);
//     }

//     const jobDetails = await Job.findById(jobId);
//     if (!jobDetails) {
//         throw new ErrorHandler("Job not found!", 404);
//     }

//     const employerId = {
//         user: jobDetails.postedBy,
//         role: "Employer"
//     };

//     if (!name || !email || !coverLetter || !phone || !applicantId.user || !employerId.user) {
//         throw new ErrorHandler("Please fill all the details", 404);
//     }

//     const application = await Application.create({
//         name,
//         email,
//         coverLetter,
//         applicantId,
//         employerId,
//         resume: {
//             public_id: cloudinaryRes.public_id,
//             url: cloudinaryRes.secure_url
//         }
//     });

//     res.status(200).json({
//         success: true,
//         message: "Application has been posted successfully",
//         application
//     });
// });


export const postApplication = catchAsyncError(async (req, res, next) => {
    const { role } = req.user;
    console.log("this is the role",role);
    if (role === "Employer") {
      return next(
        new ErrorHandler("Employer not allowed to access this resource.", 400)
      );
    }
    if (!req.files || Object.keys(req.files).length === 0) {
      return next(new ErrorHandler("Resume File Required!", 400));
    }
  
    const { resume } = req.files;
    const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedFormats.includes(resume.mimetype)) {
      return next(
        new ErrorHandler("Invalid file type. Please upload a PNG file.", 400)
      );
    }
    const cloudinaryResponse = await cloudinary.uploader.upload(
      resume.tempFilePath
    );
  
    if (!cloudinaryResponse || cloudinaryResponse.error) {
      console.error(
        "Cloudinary Error:",
        cloudinaryResponse.error || "Unknown Cloudinary error"
      );
      return next(new ErrorHandler("Failed to upload Resume to Cloudinary", 500));
    }
    const { name, email, coverLetter, phone, address, jobId } = req.body;
    const applicantID = {
      user: req.user._id,
      role: "Job Seeker",
    };
    if (!jobId) {
      return next(new ErrorHandler("Job not found!", 404));
    }
    const jobDetails = await Job.findById(jobId);
    if (!jobDetails) {
      return next(new ErrorHandler("Job not found!", 404));
    }
  
    const employerID = {
      user: jobDetails.postedBy,
      role: "Employer",
    };
    if (
      !name ||
      !email ||
      !coverLetter ||
      !phone ||
      !address ||
      !applicantID ||
      !employerID ||
      !resume
    ) {
      return next(new ErrorHandler("Please fill all fields.", 400));
    }
    const application = await Application.create({
      name,
      email,
      coverLetter,
      phone,
      address,
      applicantID,
      employerID,
      jobId,
      resume: {
        public_id: cloudinaryResponse.public_id,
        url: cloudinaryResponse.secure_url,
      },
    });
    res.status(200).json({
      success: true,
      message: "Application Submitted!",
      application,
    });
  });
  
  