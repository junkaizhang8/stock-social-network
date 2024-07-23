package cs.toronto.edu;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class Main {
	public static void main(String[] args) {
		Connection conn = null;
		Statement stmt = null;

		try {
			// 
			// Register the PostgreSQL driver
			//
			//
			Class.forName("org.postgresql.Driver");

			//
			// Connect to the database
			//
			//
			conn = DriverManager.getConnection("jdbc:postgresql://127.0.0.1:5432/mydb", "postgres", "postgres");
			System.out.println("Opened database successfully");

			//
			// Create a statement object
			//
			//
			stmt = conn.createStatement();

			//
			// Create SQL statement to insert a tuple
			//
			//
			String sqlInsert = "INSERT INTO testtbl (name, value) " +
				"VALUES ('world', 1024);";
			stmt.executeUpdate(sqlInsert);
			System.out.println("Tuple inserted successfully");

			//
			// Create SQL statement to query all tuples
			//
			//
			String sqlSelect = "SELECT name, value FROM testtbl;";
			ResultSet rs = stmt.executeQuery(sqlSelect);

			//
			// Print the queried tuples
			//
			//
			System.out.println("Table testtbl contains the following tuples:\nname \tvalue");
			while (rs.next()) {
				String name = rs.getString("name");
				int value = rs.getInt("value");
				System.out.println(name + " \t" + value);
			}
			rs.close();
		} catch (Exception e) {
			e.printStackTrace();
			System.err.println(e.getClass().getName() + ": " + e.getMessage());
			System.exit(1);
		} finally {
			try {
				if (stmt != null) stmt.close();
				if (conn != null) conn.close();
			
				System.out.println("Disconnected from the database");
			} catch (SQLException e) {
				e.printStackTrace();
			}
		}
	}
}
