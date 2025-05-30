import { useState } from 'react';
import { TableRow, TableCell, Button, Dialog } from '@mui/material';
import UserForm from './UserForm';
// import { useUserStore } from '../store/userStore';

interface UserItemProps {
  user: any;
}

export default function UserItem({ user }: UserItemProps) {
  const [open, setOpen] = useState(false);
  // const { deleteUser } = useUserStore();

  return (
    <>
      <TableRow>
        <TableCell>{user.username}</TableCell>
        <TableCell>{user.email}</TableCell>
        <TableCell>{user.role}</TableCell>
        <TableCell>
          <Button onClick={() => setOpen(true)}>Edit</Button>
          <Button color="error" onClick={() => {}}>
            Delete
          </Button>
        </TableCell>
      </TableRow>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <UserForm initialData={user} onSuccess={() => setOpen(false)} />
      </Dialog>
    </>
  );
}
