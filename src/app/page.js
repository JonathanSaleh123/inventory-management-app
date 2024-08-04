'use client'

import { useState, useEffect } from 'react'
import { Box, Stack, Typography, Button, Modal, TextField, InputAdornment, Paper } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import SendIcon from '@mui/icons-material/Send'
import { firestore } from '../firebase'
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore'

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: '#1E1E1E',
  border: '1px solid #333',
  boxShadow: '0 0 20px rgba(0, 255, 255, 0.2)',
  borderRadius: '10px',
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
  color: '#fff',
}

export default function Home() {
  const [inventory, setInventory] = useState([])
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const [itemDescription, setItemDescription] = useState('')
  const [itemQuantity, setItemQuantity] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')

  // New state for chatbot
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  // Function to handle sending a message
  const handleSendMessage = () => {
    if (inputMessage.trim() !== '') {
      setMessages([...messages, { text: inputMessage, sender: 'user' }]);
      setInputMessage('');
      // Here you would typically call an API to get the chatbot's response
      // For now, we'll just simulate a response
      setTimeout(() => {
        setMessages(prevMessages => [...prevMessages, { text: "I'm a chatbot. How can I help you?", sender: 'bot' }]);
      }, 1000);
    }
  };
  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  //Gets the inventory from the firestore database and updates the state
  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'))
    const docs = await getDocs(snapshot)
    const inventoryList = []
    docs.forEach((doc) => {
      inventoryList.push({ name: doc.id, ...doc.data() })
    })
    setInventory(inventoryList)
  }
  //Adds an item to the inventory
  const addItem = async (item, description, initialQuantity) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const { quantity, description: existingDescription } = docSnap.data()
      await setDoc(docRef, { 
        quantity: quantity + initialQuantity, 
        description: existingDescription || description 
      })
    } else {
      await setDoc(docRef, { quantity: initialQuantity, description })
    }
    await updateInventory()
  }
  const updateItemQuantity = async (item, newQuantity) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const validQuantity = Math.max(0, parseInt(newQuantity) || 0)
    if (validQuantity === 0) {
      // If the quantity is 0, remove the item
      await deleteDoc(docRef)
    } else {
      // Otherwise, update the quantity
      await setDoc(docRef, { quantity: validQuantity }, { merge: true })
    }
  
  await updateInventory()
  }
  //Removes an item from the inventory
  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      if (quantity === 1) {
        await deleteDoc(docRef)
      } else {
        await setDoc(docRef, { quantity: quantity - 1 })
      }
    }
    await updateInventory()
  }
  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  useEffect(() => {
    updateInventory()
  }, [])
    // We'll add our component logic here

    return (
      <Box
        sx={{
          width: "100vw",
          minHeight: "100vh",
          display: 'flex',
          justifyContent: 'center',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          bgcolor: '#121212',
          color: '#fff',
          padding: '2rem',
        }}
      >
        <Modal
          open={open}
          onClose={handleClose}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box sx={style}>
            <Typography id="modal-modal-title" variant="h6" component="h2">
              Add Item
            </Typography>
            <Stack width="100%" direction={'column'} spacing={2}>
              <TextField
                label="Item"
                variant="outlined"
                fullWidth
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                sx={{
                  input: { color: '#fff' },
                  '& label': { color: '#aaa' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#333' },
                    '&:hover fieldset': { borderColor: '#0ff' },
                    '&.Mui-focused fieldset': { borderColor: '#0ff' },
                  },
                }}
              />
              <TextField
                label="Description"
                multiline
                rows={4}
                variant="outlined"
                fullWidth
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                sx={{
                  textarea: { color: '#fff' },
                  '& label': { color: '#aaa' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#333' },
                    '&:hover fieldset': { borderColor: '#0ff' },
                    '&.Mui-focused fieldset': { borderColor: '#0ff' },
                  },
                }}
              />
              <TextField
                label="Quantity"
                type="number"
                variant="outlined"
                fullWidth
                value={itemQuantity}
                onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                sx={{
                  input: { color: '#fff' },
                  '& label': { color: '#aaa' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#333' },
                    '&:hover fieldset': { borderColor: '#0ff' },
                    '&.Mui-focused fieldset': { borderColor: '#0ff' },
                  },
                }}
              />
              <Button
                variant="contained"
                onClick={() => {
                  addItem(itemName, itemDescription, itemQuantity)
                  setItemName('')
                  setItemDescription('')
                  setItemQuantity(1)
                  handleClose()
                }}
                sx={{
                  bgcolor: '#00bcd4',
                  '&:hover': {
                    bgcolor: '#00acc1',
                    boxShadow: '0 0 10px #00bcd4',
                  },
                }}
              >
                Add
              </Button>
            </Stack>
          </Box>
        </Modal>
  
        <Button 
          variant="contained" 
          onClick={handleOpen}
          sx={{
            bgcolor: '#00bcd4',
            '&:hover': {
              bgcolor: '#00acc1',
              boxShadow: '0 0 10px #00bcd4',
            },
            mb: 2,
          }}
        >
          Add New Item
        </Button>
  
        <Box sx={{ 
          border: '1px solid #333', 
          borderRadius: '10px', 
          overflow: 'hidden',
          boxShadow: '0 0 20px rgba(0, 255, 255, 0.1)',
          width: '800px',
        }}>
          <Box
            sx={{
              bgcolor: '#1E1E1E',
              p: 2,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Typography variant={'h4'} color={'#fff'} textAlign={'center'}>
              Inventory Items
            </Typography>
          </Box>
  
          <Box sx={{ p: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              label="Search items"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon sx={{ color: '#aaa' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                input: { color: '#fff' },
                '& label': { color: '#aaa' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#333' },
                  '&:hover fieldset': { borderColor: '#0ff' },
                  '&.Mui-focused fieldset': { borderColor: '#0ff' },
                },
              }}
            />
          </Box>
  
          <Stack sx={{ height: '300px', overflow: 'auto', p: 2 }} spacing={2}>
            {filteredInventory.map(({name, quantity, description}) => (
              <Box
                key={name}
                sx={{
                  bgcolor: '#1E1E1E',
                  borderRadius: '5px',
                  p: 2,
                  transition: 'all 0.3s',
                  '&:hover': {
                    boxShadow: '0 0 10px rgba(0, 255, 255, 0.3)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'}>
                  <Typography variant={'h6'} color={'#fff'}>
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </Typography>
                  <Box display={'flex'} alignItems={'center'}>
                    <TextField
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const newQuantity = Math.max(0, parseInt(e.target.value) || 0);
                        updateItemQuantity(name, newQuantity);
                      }}
                      inputProps={{ min: 0, style: { textAlign: 'center', color: '#fff' } }}
                      sx={{ 
                        width: '80px', 
                        mr: 2,
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: '#333' },
                          '&:hover fieldset': { borderColor: '#0ff' },
                          '&.Mui-focused fieldset': { borderColor: '#0ff' },
                        },
                      }}
                    />
                    <Button 
                      variant="outlined" 
                      onClick={() => removeItem(name)}
                      sx={{
                        color: '#ff4d4f',
                        borderColor: '#ff4d4f',
                        '&:hover': {
                          bgcolor: 'rgba(255, 77, 79, 0.1)',
                          boxShadow: '0 0 10px rgba(255, 77, 79, 0.3)',
                        },
                      }}
                    >
                      Remove
                    </Button>
                  </Box>
                </Box>
                <Typography variant={'body2'} color={'#aaa'} mt={1}>
                  {description || 'No description available'}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      </Box>
    )
  }