import React from "react";

const UserTable = ({ users, onBan }) => {
  return (
    <table className="user-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td>{user.role}</td>
            <td>
              <button onClick={() => onBan(user.id)}>Ban</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default UserTable;