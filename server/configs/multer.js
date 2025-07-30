import multer from 'multer'


//Tells Multer to store uploaded files on disk (OS temp by default)
export const upload = multer({storage:multer.diskStorage({})})