import {Request, Response} from 'express';
import {Chat} from "../models/chat";

export const accessChat = async (req: Request, res: Response) => {     
//  const {userId} = req.body;
// const{myId} = req.body;

      try {
         let chat = await Chat.findOne({
            isGroupChat:false,
            users:{$all:[req.body.userId,req.body.myId]},
         }).populate("users","-password");

         if(chat){
          return res.json(chat);
         }

         else{
         const newChat = await Chat.create({
            chatName:"sender",
            isGroupChat:false,
            users:[req.body.myId,req.body.userId],
         });
         

         const fullChat = await Chat.findById(newChat._id).populate("users");
      

    res.status(201).json(fullChat);
         }
  } catch (error) {
    res.status(500).json({ message: "Chat creation failed" });
  }
};