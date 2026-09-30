const roverDatabase = {
    users: [
        { id: "RVR-ADM-01", email: "admin@rover.ph", password: "admin", role: "Admin", name: "Admin • Ops Manila" },
        { id: "RVR-MGT-01", email: "smalacas@rover.ph", password: "pass", role: "Manager", name: "Sigmund Malacas" },
        { id: "RVR-FLT-0382", email: "esantos@rover.ph", password: "pass", role: "Driver", name: "Eduardo Santos" },
        { id: "RVR-CLT-001", email: "r.castaneda@apexlogistics.ph", password: "pass", role: "Client", name: "Rowena Mae Castaneda" }
    ],
    fleetCapacity: 31
};
if (!localStorage.getItem("roverDB")) localStorage.setItem("roverDB", JSON.stringify(roverDatabase));
