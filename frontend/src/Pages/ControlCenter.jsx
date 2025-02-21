import React, { useEffect, useState } from "react";

const ControlCenter = () => {
  const [users, setUsers] = useState([]); // State to store user data

  // Fetch user data from the backend when the page loads
  useEffect(() => {
    fetch("http://localhost:8000/api/users") // Adjust API route when backend is ready
      .then((response) => response.json())
      .then((data) => setUsers(data))
      .catch((error) => console.error("Error fetching users:", error));
  }, []);

  // Function to activate/deactivate users
  // const toggleStatus = (userId, currentStatus) => {
  //   fetch(`http://localhost:8000/api/users/${userId}/toggle-status`, {
  //     method: "PATCH",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ is_active: !currentStatus }),
  //   })
  //     .then((response) => response.json())
  //     .then((updatedUser) => {
  //       setUsers((prevUsers) =>
  //         prevUsers.map((user) => (user.id === userId ? updatedUser : user)),
  //       ); // ✅ Correct state update
  //     })
  //     .catch((error) => console.error("Error updating status:", error));
  // };
  //
  return (
    <div>
      <h1>Admin Control Panel</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {/* {users.map((user) => ( */}
          {/* <tr key={user.id}> */}
          {/* <td>{user.name}</td> */}
          {/* <td>{user.email}</td> */}
          {/* <td>{user.is_active ? "Active" : "Deactivated"}</td> */}
          {/* <td> */}
          {/*   <button onClick={() => toggleStatus(user.id, user.is_active)}> */}
          {/*     {user.is_active ? "Deactivate" : "Activate"} */}
          {/*   </button> */}
          {/* </td> */}
          {/* </tr> */}
          {/* ))} */}
        </tbody>
      </table>
    </div>
  );
};

export default ControlCenter;
