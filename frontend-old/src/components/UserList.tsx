import { useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress } from '@mui/material';
import UserItem from './UserItem';
// import { useUserStore } from '../store/userStore';

export default function UserList() {
  // const { users, loading, fetchUsers } = useUserStore();

  // useEffect(() => {
  //   fetchUsers();
  // }, [fetchUsers]);

  // if (loading) return <CircularProgress />;

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Username</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {/* {users.map((user) => (
            <UserItem key={user.id} user={user} />
          ))} */}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
